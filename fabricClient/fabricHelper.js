var Client = require('fabric-client');

function encroll(org) {
    var client = Client.loadFromConfig('configs/fabric-network-config/connection-profile.yaml');
    var caService;
    let username = `admin-${org}`;
    let password = `admin-${org}pw`;
    console.log(`Encroll with username ${username}`);
    client.loadFromConfig(`configs/fabric-network-config/${org}-profile.yaml`);

    // init the storages for client's state and cryptosuite state based on connection profile configuration 
    return client.initCredentialStores()
        .then(() => {
            // tls-enrollment
            caService = client.getCertificateAuthority();
            return caService.enroll({
                enrollmentID: username,
                enrollmentSecret: password,
                profile: 'tls',
                attr_reqs: [
                    { name: "hf.Registrar.Roles" },
                    { name: "hf.Registrar.Attributes" }
                ]
            }).then((enrollment) => {
                console.log('Successfully called the CertificateAuthority to get the TLS material');
                let key = enrollment.key.toBytes();
                let cert = enrollment.certificate;

                // set the material on the client to be used when building endpoints for the user
                client.setTlsClientCertAndKey(cert, key);
                return client.setUserContext({ username: username, password: password });
            }).then(() => {
                return client;
            });
        })
}

module.exports.encroll = encroll;

function encrollOrdering(org) {
    var client = Client.loadFromConfig('configs/fabric-network-config/connection-profile.yaml');
    var caService;
    let username = `admin-${org}`;
    let password = `admin-${org}pw`;
    console.log(`Encroll with username ${username}`);
    client.loadFromConfig(`configs/fabric-network-config/${org}-profile.yaml`);

    // init the storages for client's state and cryptosuite state based on connection profile configuration 
    return client.initCredentialStores()
        .then(() => {
            // tls-enrollment
            caService = client.getCertificateAuthority();
            return caService.enroll({
                enrollmentID: username,
                enrollmentSecret: password,
                profile: 'tls'
            }).then((enrollment) => {
                console.log('Successfully called the CertificateAuthority to get the TLS material');
                let key = enrollment.key.toBytes();
                let cert = enrollment.certificate;

                // set the material on the client to be used when building endpoints for the user
                client.setTlsClientCertAndKey(cert, key);
                return client.setUserContext({ username: username, password: password });
            }).then(() => {
                return client;
            });
        })
}

module.exports.encrollOrdering = encrollOrdering;