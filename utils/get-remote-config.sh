#!/bin/bash
set -e
usage() {
	echo "Usage: $0 [-d <service_path>] -t [tmp_path] -p [ip host] -k [key_path] -g [list_of_orgs] -c [list_of_channels]" 1>&2
	exit 1
}
while getopts ":d:t:p:k:g:c:" o; do
	case "${o}" in
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
	*)
		usage
		;;
	esac
done
shift $((OPTIND - 1))
if [ -z "${d}" ] || [ -z "${t}" ] || [ -z "${p}" ] || [ -z "${k}" ] || [ -z "${g}" ] || [ -z "${c}" ]; then
	usage
fi
IP=${p}
CONFIG_PATH=${d}
TMP_CONFIG_PATH=${t}
KEY_PATH=${k}
ORGS=${g}
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

for org in $ORGS; do
	if [ -f ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.key ]; then
		mv ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.key ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/server.key
	fi
	if [ -f ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.crt ]; then
		mv ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/client.crt ${CONFIG_PATH}/crypto-config/orgs/${org}/admin/tls/server.crt
	fi
done
if [ -f ${CONFIG_PATH}/fabric-network-config/connection-profile.yaml ]; then
	rm -f ${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
fi

for channel in $c; do
	echo "${channel}" >>${CONFIG_PATH}/fabric-network-config/channels.txt
done

for org in $ORGS; do
	echo "# The name of connection profile
name: \"${org} Client\"
version: \"1.0\"

# Client section is for NodeJS SDK. 
client:
  organization: ${org} # The org that this app instance belong to
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
    path: \"/tmp/hfc-kvs/${org}\"
    cryptoStore: # Cryptosuite store of Client instance
      path: \"/tmp/hfc-cvs/${org}\"
" >>${CONFIG_PATH}/fabric-network-config/${org}-profile.yaml
done

echo 'name: "Deevo network"
version: "1.0"
# Optinal. But most app would have this so that channle objects can be constructed based on this section.
channels:' >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml

for channel in $c; do
	echo "
  ${channel}: # name of channel
    orderers:
      - orderer0.org0.deevo.io
    peers:" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
	for org in $ORGS; do
		if [ "${org}" != "org0" ]; then
			echo "      peer0.${org}.deevo.io:
        endorsingPeer: true
        chaincodeQuery: true
        ledgerQuery: true
        eventSource: true" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
		fi
	done
done

echo "
organizations:" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
echo "  org0:
    mspid: org0MSP
    certificateAuthorities:
      - rca.org0.deevo.io
    adminPrivateKey:
      path: configs/crypto-config/orgs/org0/admin/tls/server.key
    signedCert:
      path: configs/crypto-config/orgs/org0/admin/tls/server.crt" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
for org in $ORGS; do
  if [ "${org}" != "org0" ]; then
	echo "  ${org}:
    mspid: ${org}MSP
    peers: 
      - peer0.${org}.deevo.io
    certificateAuthorities:
      - rca.${org}.deevo.io
    adminPrivateKey:
      path: configs/crypto-config/orgs/${org}/admin/tls/server.key
    signedCert:
      path: configs/crypto-config/orgs/${org}/admin/tls/server.crt" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
  fi
done
echo "
orderers:
  orderer0.org0.deevo.io:
    url: grpcs://orderer0.org0.deevo.io:7050
    grpcOptions:
      ssl-target-name-override: orderer0.org0.deevo.io
      grpc-keepalive-timeout-ms: 3000
      grpc.keepalive_time_ms: 360000
      grpc-max-send-message-length: 10485760
      grpc-max-receive-message-length: 10485760
    tlsCACerts:
      path: configs/crypto-config/orgs/org0/msp/tlscacerts/tls-rca-org0-deevo-io-7054.pem
peers:" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
for org in $ORGS; do
	if [ "${org}" != "org0" ]; then
		echo "  peer0.${org}.deevo.io:
    url: grpcs://peer0.${org}.deevo.io:7051
    eventUrl: grpcs://peer0.${org}.deevo.io:7053
    grpcOptions:
      ssl-target-name-override: peer0.${org}.deevo.io
      grpc.keepalive_time_ms: 600000
    tlsCACerts:
      path: configs/crypto-config/orgs/${org}/msp/tlscacerts/tls-rca-${org}-deevo-io-7054.pem" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
	fi
done
echo "
certificateAuthorities:" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
for org in $ORGS; do
	echo "  rca.${org}.deevo.io:
    url: https://rca.${org}.deevo.io:7054
    httpOptions:
      verify: false
    tlsCACerts:
      path: configs/crypto-config/ca/tls.rca.${org}.deevo.io.pem
    registrar:
      - enrollId: rca-${org}-admin
        enrollSecret: rca-${org}-adminpw
    caName: rca.${org}.deevo.io" >>${CONFIG_PATH}/fabric-network-config/connection-profile.yaml
done

# ./utils/get-remote-config.sh -d /home/ubuntu/deevo/sc-status.deevo.io/configs -t /tmp/status -p x.x.x.x -k /var/ssh-keys/dev-full-rights.pem -g "org0 org1 org2 org3 org4 org5" -c "deevochannel aimthaichannel"