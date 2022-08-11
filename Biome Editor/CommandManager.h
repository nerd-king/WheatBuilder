#pragma once
#include <RegCommandAPI.h>
#include <DynamicCommandAPI.h>
#include <MC/Types.hpp>
#include <MC/Player.hpp>
#include <MC/ServerPlayer.hpp>
#include "BiomeManager.h"

#include <fstream>

void regCommand() {
      using ParamType = DynamicCommand::ParameterType;
      //// create a dynamic command
      auto command = DynamicCommand::createCommand("be", "Biome Editor", CommandPermissionLevel::GameMasters);

      auto& optionsBiome  = command->setEnum("BiomeOptions" , { "biome"   });
      auto& optionsBiomes = command->setEnum("BiomesOptions", { "biomes"  });
      auto& optionsSetId    = command->setEnum("SetOptionsId"   , { "set_id"     });
      auto& optionsSetName = command->setEnum("SetOptionsName", { "set_name" });
      auto& optionsGet    = command->setEnum("GetOptions"   , { "get"     });
      auto& optionsReplaceId = command->setEnum("ReplaceOptionsId",{ "replace_id" });
      auto& optionsReplaceName = command->setEnum("ReplaceOptionsName", { "replace_name" });

      command->mandatory("opEnum1", ParamType::Enum, optionsBiome , CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("opEnum1", ParamType::Enum, optionsBiomes, CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("opEnum2", ParamType::Enum, optionsGet   , CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("opEnum2", ParamType::Enum, optionsSetId   , CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("opEnum2", ParamType::Enum, optionsSetName, CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("opEnum2", ParamType::Enum, optionsReplaceId, CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("opEnum2", ParamType::Enum, optionsReplaceName, CommandParameterOption::EnumAutocompleteExpansion);
      command->mandatory("fileName" , ParamType::String);
      command->mandatory("dimId"    , ParamType::Int);
      command->mandatory("originId" , ParamType::Int);
      command->mandatory("originName", ParamType::String);
      command->mandatory("replaceId", ParamType::Int);
      command->mandatory("replaceName", ParamType::String);
      command->mandatory("biomeId"  , ParamType::Int);
      command->mandatory("biomeName", ParamType::String);
      command->mandatory("pos"      , ParamType::BlockPos);
      command->mandatory("startPos" , ParamType::BlockPos);
      command->mandatory("endPos"   , ParamType::BlockPos);

      command->addOverload({ optionsBiome, optionsGet, "pos", "dimId"});
      command->addOverload({ optionsBiome, optionsSetId, "pos", "dimId", "biomeId"});
      command->addOverload({ optionsBiome, optionsSetName, "pos", "dimId", "biomeName" });

      // command->addOverload({ optionsBiomes,optionsSet, "pos", "dimId", "fileName" });
      // command->addOverload({ optionsBiomes,optionsGet, "startPos", "endPos", "dimId", "fileName" });
      command->addOverload({ optionsBiomes,optionsReplaceId, "startPos", "endPos", "dimId", "originId", "replaceId" });
      command->addOverload({ optionsBiomes,optionsReplaceName, "startPos", "endPos", "dimId", "originName", "replaceName" });

      command->setCallback([](DynamicCommand const& command, CommandOrigin const& origin, CommandOutput& output, std::unordered_map<std::string, DynamicCommand::Result>& results) {
          switch (do_hash(results["opEnum1"].get<std::string>().c_str()))
          {
          case do_hash("biome"):
              switch (do_hash(results["opEnum2"].get<std::string>().c_str()))
              {
                  case do_hash("get"): {
                      BlockPos pos = results["pos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();
                      auto res = BiomeManager::getbiomeIdAndName(pos.x, pos.y, pos.z, dimId);
                      output.success(fmt::format("id: {}, name: {}", res.first, res.second));
                      break;
                  }
                  case do_hash("set_id"): {
                      BlockPos pos = results["pos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();
                      int biomeId = results["biomeId"].get<int>();
                      auto res = BiomeManager::setBiomeById(pos.x, pos.y, pos.z, dimId, biomeId);
                      output.success(fmt::format("set biome to: {}", res));
                      break;
                  }
                  case do_hash("set_name"): {
                      BlockPos pos = results["pos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();
                      string biomeName = results["biomeName"].get<std::string>();
                      int res = BiomeManager::setBiomeByName(pos.x, pos.y, pos.z, dimId, biomeName);
                      output.success(fmt::format("set biome to: id {}", res));
                      break;
                  }
                  default:
                      break;
              }
              break;
          case do_hash("biomes"):
              switch (do_hash(results["opEnum2"].get<std::string>().c_str()))
              {
                  case do_hash("get"): {
                      BlockPos startPos = results["startPos"].get<BlockPos>();
                      BlockPos endPos   = results["endPos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();
                      string fileName = results["fileName"].get<std::string>();
                      string res = BiomeManager::getBiomeIds(startPos.x, startPos.y, startPos.z,
                          endPos.x, endPos.y, endPos.z, dimId).dump();

                      std::ofstream file;
                      file.open("plugins/WheatBuilder/Biomes/" + fileName + ".json", std::ios::out | std::ios::_Noreplace);
                      file << res;
                      output.success("get");
                      break;
                  }
                  case do_hash("set"): {
                      BlockPos pos = results["pos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();
                      string fileName = results["fileName"].get<std::string>();
                      if (_access(("plugins/WheatBuilder/Biomes/" + fileName + ".json").c_str(), 0) == 0) {
                          std::ifstream file;
                          string biomesString;
                          file.open("plugins/WheatBuilder/Biomes/" + fileName + ".json", std::ios::in);
                          file >> biomesString;
                          nlohmann::json biomes;
                          try {
                              biomes = json::parse(biomesString.c_str(), nullptr, true);
                              string res = BiomeManager::setBiomes(pos.x, pos.y, pos.z, dimId, biomes);
                              if (res == "OK") {
                                  output.success("set biomes success.");
                              }
                              else {
                                  output.success("set biomes failed.");
                              }
                          }
                          catch (const std::exception& ex) {
                              output.error(fmt::format("Error in biomes string:{}", ex.what()));
                          }
                      }
                      else {
                          output.error("File not exist.");
                      }
                      break;
                  }
                  case do_hash("replace_id"): {
                      BlockPos startPos = results["startPos"].get<BlockPos>();
                      BlockPos endPos   = results["endPos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();
                      
                      int originId = results["originId"].get<int>();
                      int replaceId = results["replaceId"].get<int>();
                      auto res = BiomeManager::replaceBiomesById(startPos.x, startPos.y, startPos.z, 
                          endPos.x, endPos.y, endPos.z, dimId, originId, replaceId);
                      output.success("replace");
                      break;
                  }
                  case do_hash("replace_name"): {
                      BlockPos startPos = results["startPos"].get<BlockPos>();
                      BlockPos endPos = results["endPos"].get<BlockPos>();
                      int dimId = results["dimId"].get<int>();

                      string originName = results["originName"].get<std::string>();
                      string replaceName = results["replaceName"].get<std::string>();
                      auto res = BiomeManager::replaceBiomesByName(startPos.x, startPos.y, startPos.z,
                          endPos.x, endPos.y, endPos.z, dimId, originName, replaceName);

                      output.success("replace");
                      break;
                  }
                  default:
                      break;
              }
              break;
          default:
              break;
          }
      });
      // do not forget to setup the command instance
      DynamicCommand::setup(std::move(command));
}