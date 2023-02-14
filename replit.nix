{ pkgs }: {
	deps = [
		pkgs.lsof
  pkgs.zip
  pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
	];
}