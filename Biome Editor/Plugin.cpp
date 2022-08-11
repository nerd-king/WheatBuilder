#include "pch.h"
#include <EventAPI.h>
#include <LoggerAPI.h>
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

#include "BiomeManager.h"
#include "CommandManager.h"

/* --------------------------------------- *\
 *  Name        :  BiomeEditor             *
 *  Description :  WheatBuilder series     *
 *  Version     :  1.0.0                   *
 *  Author      :  ENIAC_Jushi             *
\* --------------------------------------- */

Logger logger(PLUGIN_NAME);

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
    if (_access("plugins/WheatBuilder", 0) != 0) {
        if (!_mkdir("plugins/WheatBuilder")) logger.fatal("Dir \"plugins/WheatBuilder\" make failed.");
    }
    if (_access("plugins/WheatBuilder/Biomes", 0) != 0) {
        if (!_mkdir("plugins/WheatBuilder/Biomes")) logger.fatal("Dir \"plugins/WheatBuilder/Biomes\" make failed.");
    }
    Event::RegCmdEvent::subscribe([](Event::RegCmdEvent ev) {
        regCommand();
        return true;
        });
    CheckProtocolVersion();
    logger.info("WheatBuilder: BiomeEditor loaded.");
}

