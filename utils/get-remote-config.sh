#!/bin/bash
set -e
usage() {
	echo "Usage: $0 [-d <service path>] -t [tmp path] -p [ip of orderer host] -k [key path] -g [orgs of peers] -o [orgs of orderers] -c [list of channels]" 1>&2
	exit 1
}
while getopts ":d:t:p:k:g:c:o:" x; do
	case "${x}" in
	d)
		d=${OPTARG}
		;;
	t)
		t=${OPTARG}
		;;
	p)
		p=${OPTARG}
		;;
	k)
		k=${OPTARG}
		;;
	g)
		g=${OPTARG}
		;;
	c)
		c=${OPTARG}
		;;
  o)
		o=${OPTARG}
		;;
	*)
		usage
		;;
	esac
done
shift $((OPTIND - 1))
if [ -z "${d}" ] || [ -z "${t}" ] || [ -z "${p}" ] || [ -z "${k}" ] || [ -z "${g}" ] || [ -z "${c}" ]  || [ -z "${o}" ]; then
	usage
fi
IP=${p}
CONFIG_PATH=${d}
TMP_CONFIG_PATH=${t}
KEY_PATH=${k}
PEER_ORGS=${g}
ORDERER_ORGS=${o}
mkdir -p ${CONFIG_PATH}/crypto-config
mkdir -p ${CONFIG_PATH}/fabric-network-config
rm -rf ${CONFIG_PATH}/crypto-config/*
rm -rf ${CONFIG_PATH}/fabric-network-config/*
mkdir -p ${TMP_CONFIG_PATH}
rm -rf ${TMP_CONFIG_PATH}/*
rm -rf /tmp/hfc-cvs
rm -rf /tmp/hfc-kvs
echo "get from server ${IP}..."
scp -i ${k} -r ubuntu@${IP}:/home/ubuntu/hyperledgerconfig/data/* ${TMP_CONFIG_PATH}/
echo "done..."
sleep 2
echo "copy to config folder"
cp -R ${TMP_CONFIG_PATH}/* ${CONFIG_PATH}/crypto-config/

for org in $PEER_ORGS; do
	if [ -f ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.key ]; then
		mv ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.key ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/server.key
	fi
	if [ -f ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.crt ]; then
		mv ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.crt ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/server.crt
	fi
done
for org in $ORDERER_ORGS; do
	if [ -f ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.key ]; then
		mv ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.key ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/server.key
	fi
	if [ -f ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.crt ]; then
		mv ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.crt ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/server.crt
	fi
done

CONFIG_FILE_PATH=${CONFIG_PATH}/fabric-network-config/connection-profile.yaml

if [ -f ${CONFIG_FILE_PATH} ]; then
	rm -f ${CONFIG_FILE_PATH}
fi

function createOrgProfile() {
  if [ $# -ne 1 ]; then
		echo "Usage: createOrgProfile <ORG>: $*"
		exit 1
	fi
	ORG=$1

  echo "# The name of connection profile
name: \"${ORG} Client\"
version: \"1.0\"

# Client section is for NodeJS SDK. 
client:
  organization: ${ORG} # The org that this app instance belong to
  # set connection timeouts for the peer and orderer for the client
  connection:
    timeout:
      peer:
        # the timeout in seconds to be used on requests to a peer,
        # for example sendTransactionProposal
        endorser: 120
        # the timeout in seconds to be used by applications when waiting for an
        # event to occur. This time should be used in a javascript timer object
        # that will cancel the event registration with the event hub instance.
        eventHub: 60
        # the timeout in seconds to be used when setting up the connection
        # with the peers event hub. If the peer does not acknowledge the
        # connection within the time, the application will be notified over the
        # error callback if provided.
        eventReg: 30
      # the timeout in seconds to be used on request to the orderer,
      # for example
      orderer: 30
  credentialStore: # KVS of Client instance
    path: \"/tmp/hfc-kvs/${ORG}\"
    cryptoStore: # Cryptosuite store of Client instance
      path: \"/tmp/hfc-cvs/${ORG}\"
" >>${CONFIG_PATH}/fabric-network-config/${ORG}-profile.yaml
}

for org in $PEER_ORGS; do
  createOrgProfile $org
done

for org in $ORDERER_ORGS; do
  createOrgProfile $org
done

for channel in $c; do
	echo "${channel}" >>${CONFIG_PATH}/fabric-network-config/channels.txt
done

echo 'name: "Deevo network"
version: "1.0"
# Optinal. But most app would have this so that channle objects can be constructed based on this section.
channels:' >>${CONFIG_FILE_PATH}

for channel in $c; do
	echo "
  ${channel}: # name of channel
    orderers:" >>${CONFIG_FILE_PATH}
  for org in $ORDERER_ORGS; do
		echo "      - orderer0.${org}.deevo.io" >>${CONFIG_FILE_PATH}
	done
  echo "    peers:" >>${CONFIG_FILE_PATH}
	for org in $PEER_ORGS; do
		echo "      peer0.${org}.deevo.io:
        endorsingPeer: true
        chaincodeQuery: true
        ledgerQuery: true
        eventSource: true" >>${CONFIG_FILE_PATH}
	done
done

echo "
organizations:" >>${CONFIG_FILE_PATH}
for org in $ORDERER_ORGS; do
	echo "  ${org}:
    mspid: ${org}MSP
    certificateAuthorities:
      - rca.${org}.deevo.io
    adminPrivateKey:
      path: configs/crypto-config/orgs/${org}/admin/tls/server.key
    signedCert:
      path: configs/crypto-config/orgs/${org}/admin/tls/server.crt" >>${CONFIG_FILE_PATH}
done

for org in $PEER_ORGS; do
	echo "  ${org}:
    mspid: ${org}MSP
    peers: 
      - peer0.${org}.deevo.io
    certificateAuthorities:
      - rca.${org}.deevo.io
    adminPrivateKey:
      path: configs/crypto-config/orgs/${org}/admin/tls/server.key
    signedCert:
      path: configs/crypto-config/orgs/${org}/admin/tls/server.crt" >>${CONFIG_FILE_PATH}
done

echo "orderers:" >>${CONFIG_FILE_PATH}
for org in $ORDERER_ORGS; do
	echo "  orderer0.${org}.deevo.io:
    url: grpcs://orderer0.${org}.deevo.io:7050
    grpcOptions:
      ssl-target-name-override: orderer0.${org}.deevo.io
      grpc-keepalive-timeout-ms: 3000
      grpc.keepalive_time_ms: 360000
      grpc-max-send-message-length: 10485760
      grpc-max-receive-message-length: 10485760
    tlsCACerts:
      path: configs/crypto-config/orgs/${org}/msp/tlscacerts/tls-rca-${org}-deevo-io-7054.pem" >>${CONFIG_FILE_PATH}
done

echo "peers:" >>${CONFIG_FILE_PATH}
for org in $PEER_ORGS; do
	echo "  peer0.${org}.deevo.io:
    url: grpcs://peer0.${org}.deevo.io:7051
    eventUrl: grpcs://peer0.${org}.deevo.io:7053
    grpcOptions:
      ssl-target-name-override: peer0.${org}.deevo.io
      grpc.keepalive_time_ms: 600000
    tlsCACerts:
      path: configs/crypto-config/orgs/${org}/msp/tlscacerts/tls-rca-${org}-deevo-io-7054.pem" >>${CONFIG_FILE_PATH}
done
echo "
certificateAuthorities:" >>${CONFIG_FILE_PATH}

function createCAProfile() {
  if [ $# -ne 1 ]; then
		echo "Usage: createCAProfile <ORG>: $*"
		exit 1
	fi
	ORG=$1

  echo "  rca.${ORG}.deevo.io:
    url: https://rca.${ORG}.deevo.io:7054
    httpOptions:
      verify: false
    tlsCACerts:
      path: configs/crypto-config/ca/tls.rca.${ORG}.deevo.io.pem
    registrar:
      - enrollId: rca-${ORG}-admin
        enrollSecret: rca-${ORG}-adminpw
    caName: rca.${ORG}.deevo.io" >>${CONFIG_FILE_PATH}
}

for org in $ORDERER_ORGS; do
  createCAProfile $org
done

for org in $PEER_ORGS; do
  createCAProfile $org
done


# ./utils/get-remote-config.sh -d /home/ubuntu/deevo/sc-status.deevo.io/configs -t /tmp/status -p x.x.x.x -k /var/ssh-keys/dev-full-rights.pem -g "org1 org2 org3 org4 org5" -o "org0" -c "deevochannel aimthaichannel"
