#include "pch.h"
#include <EventAPI.h>

#include <MC/Level.hpp>
#include <MC/BlockInstance.hpp>
#include <MC/Block.hpp>
#include <MC/BlockSource.hpp>
#include <MC/Actor.hpp>
#include <MC/Player.hpp>
#include <MC/ItemStack.hpp>
#include "Version.h"
#include <LLAPI.h>
#include <ServerAPI.h>

#include <MC/LevelChunk.hpp>
#include <MC/Biome.hpp>
#include <MC/ChunkBlockPos.hpp>
#include <MC/ChunkSource.hpp>
#include <MC/ChunkPos.hpp>
#include <MC/Dimension.hpp>
#include <Global.h>
#include <RegCommandAPI.h>
#include <MC/Types.hpp>
#include <direct.h>

#include "Config.h"
#include "BiomeManager.h"
#include "CommandManager.h"

/* --------------------------------------- *\
 *  Name        :  BiomeEditor             *
 *  Description :  WheatBuilder series     *
 *  Version     :  1.0.0                   *
 *  Author      :  ENIAC_Jushi             *
\* --------------------------------------- */



inline void CheckProtocolVersion() {
#ifdef TARGET_BDS_PROTOCOL_VERSION
    auto currentProtocol = LL::getServerProtocolVersion();
    if (TARGET_BDS_PROTOCOL_VERSION != currentProtocol)
    {
        logger.warn("Protocol version not match, target version: {}, current version: {}.",
            TARGET_BDS_PROTOCOL_VERSION, currentProtocol);
        logger.warn("This will most likely crash the server, please use the Plugin that matches the BDS version!");
    }
#endif // TARGET_BDS_PROTOCOL_VERSION
}



void PluginInit()
{
    FileTool::makeDir("plugins/WheatBuilder");
    FileTool::makeDir("plugins/WheatBuilder/Biomes");
    FileTool::makeDir("plugins/WheatBuilder/Chunks");
    config.load("plugins/WheatBuilder/Config.json");
    
    Event::RegCmdEvent::subscribe([](Event::RegCmdEvent ev) {
        CommandManager::set();
        return true;
        });
    CheckProtocolVersion();
    logger.info("WheatBuilder: BiomeEditor and MoveChunk loaded.");
}

