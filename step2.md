awal" jalankan perintah ini di orgo.ai
jalankan perintah ini diterminal : 
1. sudo apt update && sudo apt upgrade -y
2. sudo apt install -y curl build-essential pkg-config libssl-dev git-all protobuf-compiler ca-certificates
3. curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
4. source "$HOME/.cargo/env"
5. rustup default stable
6. git clone https://github.com/nexus-xyz/nexus-cli.git
7. cd nexus-cli/clients/cli
8. cargo build --release
9. ./target/release/nexus-network register-user --wallet-address (isi wallet mu)
10. ./target/release/nexus-network start --node-id (isi dengan cli id)

pantau aktivitas di terminal orgo.ai karena kadang stuck di tampilan nya dan tidak mau menjalankan perintah selanjutnya 