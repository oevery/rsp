{ pkgs, ... }:
{
  home.username = "dev";
  home.homeDirectory = "/Users/dev";

  imports = [
    ./modules/editor.nix
  ];
}
