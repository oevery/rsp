{
  description = "Pseudo-real Home Manager / nix-darwin config";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager.url = "github:nix-community/home-manager";
  };

  outputs = { self, nixpkgs, home-manager, ... }: {
    darwinConfigurations.macbook = {
      system = "aarch64-darwin";
    };
  };
}
