#!/bin/bash
# create tmp vault password file
cat <<EOF > /tmp/vault-passphrase
${VAULT_PASS}
EOF

ansible-playbook ansible/deployment.yml --vault-password-file /tmp/vault-passphrase

rm /tmp/vault-passphrase
