win64cgo := "CGO_ENABLED=1 CXX=x86_64-w64-mingw32-g++ CC=x86_64-w64-mingw32-gcc GOOS=windows GOARCH=amd64"
wingoargs := '-ldflags "-s -w -H=windowsgui -extldflags=-static"'

dev *args:
	go run app/cmd/shandi/main.go {{args}}

build-app-full: build-app-frontend build-app

[linux]
build-app:
	go build -o shandi app/cmd/shandi/main.go
	sudo setcap cap_net_admin,cap_net_raw+ep shandi

[windows]
build-app: generate-app-winres
	go build -o shandi.exe {{wingoargs}} app/cmd/shandi/main.go

generate-app-winres:
	cd app && go-winres make 

# cross compile the app onto windows (assuming you have mingw32 installed)
build-app-xc-windows: generate-app-winres
	{{win64cgo}} go build -o shandi.exe {{wingoargs}} app/cmd/shandi/main.go

build-app-frontend:
	cd app && yarn build

# generate packets from meter-core
generate-packets *args:
	deno run --allow-all bin/generate-packets.ts {{args}}

# generate protobuf Go/TS sources
generate-proto:
	go generate lsb/proto/v1/doc.go
	cd lsb
	protoc --proto_path=proto/v1/ --plugin=protoc-gen-ts_proto=node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=src --ts_proto_opt=esModuleInterop=true --ts_proto_opt=forceLong=string proto/v1/lsb.proto

generate: generate-packets generate-proto

pull-meter-data:
	cd data/meter-data && git pull origin main

update:
	git submodule update --init --recursive

setup:
	go install github.com/tc-hib/go-winres@latest