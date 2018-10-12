#!/bin/bash
set -e
usage() {
	echo "Usage: $0 [-a <address_host>] -k [key_path] -d [list_of_ignore_directories] -s [source_code_root_dir] -t [target_root_dir]" 1>&2
	exit 1
}
while getopts ":a:k:d:s:t:" o; do
	case "${o}" in
	a)
		a=${OPTARG}
		;;
	k)
		k=${OPTARG}
		;;
	d)
		d=${OPTARG}
		;;
	s)
		s=${OPTARG}
		;;
	t)
		t=${OPTARG}
		;;
	*)
		usage
		;;
	esac
done
shift $((OPTIND - 1))
if [ -z "${a}" ] || [ -z "${k}" ] || [ -z "${d}" ] || [ -z "${s}" ] || [ -z "${t}" ]; then
	usage
fi
IP=${a}
KEY_PATH=${k}
IGNORE_DIRS=${d}
SOURCE_CODE_ROOT_DIR=${s}
TARGET_ROOT_DIR=${t}

echo "start deploying files to server ${IP}..."
for subdir in $(ls ${SOURCE_CODE_ROOT_DIR}/); do
	upload=true
	for ignore_dir in $IGNORE_DIRS; do
		if [ ${ignore_dir} == ${subdir} ]; then
			upload=false
		fi
	done

	if [ ${upload} = true ]; then
		echo "... pushing ${SOURCE_CODE_ROOT_DIR}/${subdir} -->  ubuntu@${IP}:${TARGET_ROOT_DIR}/"
		scp -i ${KEY_PATH} -r ${SOURCE_CODE_ROOT_DIR}/${subdir} ubuntu@${IP}:${TARGET_ROOT_DIR}/
	fi
done
echo "done..."

# To run: cd ~/Working/Deevo/src/network-status-service && sudo ./deploy-to-api-server.sh -a 18.136.205.13 -k ~/Working/Deevo/pem/dev-full-rights.pem -d "node_modules" -s ~/Working/Deevo/src/network-status-service -t /home/ubuntu/supplychain-service
