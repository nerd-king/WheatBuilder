
// ==================== Title ====================

  /* ---------------------------------------- *\
   *  Name        :  Building Gadgets         *
   *  Description :  A plugin for survivors   *
   *  Version     :  0.1.0                    *
   *  Author      :  ENIAC_Jushi              *
  \* ---------------------------------------- */

// ==================== Docs =======================

// ================== Initialize ===================
var PLUGIN_PATH = "plugins/BuildingGadgets/";
let version = 0.1
function load(){
    // logger output
    logger.setConsole(true);
    logger.setTitle('BG');
    logger.info('Building Gadgets is running');
    Config.load();    
    logger.info(Config.toString());
    loadData();

    menu_0.set();
    menu_1.set();
    
    // floder
    if(!file.exists(PLUGIN_PATH)) {
        file.mkdir(PLUGIN_PATH);
    }
}
Config = {
    autoPermission:false,
    landPlugin:"iLand",
    money:{
        type: "score",
        name: "money"
    },
    tool:{
        wand:"minecraft:wooden_hoe",
        menu:"minecraft:wooden_shovel"
    },
    copy:{
        cost   : 2,
        maxSize: 2048
    },
    fill:{
        cost   : 1,
        maxSize: 1024
    },
    load:function(){
        // 判断文件是否存在, 不存在则以默认配置创建
        if(!file.exists(PLUGIN_PATH + "config.json")) {
            file.writeTo(PLUGIN_PATH + "config.json", JSON.stringify({
                // 数据文件的路径
                "autoPermission": false,
                "landPlugin"    : "iLand",
                "dataPath"      : "plugins/BuildingGadgets/",
                // 金钱
                "money":{
                    "type": "score", // score/LLMoney
                    "name": "money"
                },
                // 工具
                "tool":{
                    "wand"         : "wheat:kami",       // 选区工具(御币)
                    "menu"         : "wheat:yinyang_orb" // 菜单工具(阴阳玉)
                },
                // 复制
                "copy":{
                    "cost"   : 2    , // 进行操作的费用, 按方块数量记
                    "maxSize": 1024   // 一次操作可影响的最大方块数量
                },
                // 填充
                "fill":{
                    "cost"   : 1    ,
                    "maxSize": 1024
                }
            } , null , '\t'));
            setTimeout(() => { logger.info('未找到配置文件，以默认配置启动'); }, 6000);
        }

        var c = JSON.parse(file.readFrom(PLUGIN_PATH + "config.json"));
        Config.autoPermission = c["autoPermission"];
        Config.money.type = c["money"]["type"];
        Config.money.name = c["money"]["name"];

        Config.tool.wand  = c["tool"]["wand"];
        Config.tool.menu  = c["tool"]["menu"];
        
        Config.copy.cost    = c["copy"]["cost"];
        Config.copy.maxSize = c["copy"]["maxSize"];

        Config.fill.cost    = c["fill"]["cost"];
        Config.fill.maxSize = c["fill"]["maxSize"];

        PLUGIN_PATH         = c["dataPath"];
        Config.landPlugin   = c["landPlugin"];
    },
    toString:function(){
        return "Loading...\n\n   =====================================\n"
        + "\t[datapath] " + PLUGIN_PATH + "\n"
        + "\t[AutoPermission] "    + Config.autoPermission         + "\n"
        + "\t[landPlugin] "        + Config.landPlugin             + "\n"
        + "\t[money]\n"
        + "\t  type:\t\t"          + Config.money.type             + "\n"
        + "\t  name:\t\t"          + Config.money.name             + "\n"
        + "\t[tool]\n"
        + "\t  wand:\t\t"          + Config.tool.wand              + "\n"
        + "\t  menu:\t\t"          + Config.tool.menu              + "\n"
        + "\t[copy]\n"
        + "\t  cost:\t\t"          + Config.copy.cost              + "\n"
        + "\t  maxSize:\t"         + Config.copy.maxSize           + "\n"
        + "\t[fill]\n"
        + "\t  cost:\t\t"          + Config.fill.cost              + "\n"
        + "\t  maxSize:\t"         + Config.fill.maxSize           + "\n"
        + "   =====================================\n";
    }
}
menu_0 = {
    value: mc.newSimpleForm(),
    set:function(){
        this.value.setTitle("Building Gadgets");
        this.value.addButton("Copy");
        this.value.addButton("Paste");
        this.value.addButton("Fill");
    },
    callBack(player, id){
        if(id == 0){ player.runcmd("bg copy");  return; }
        if(id == 1){ player.runcmd("bg paste"); return; }
        if(id == 2){ player.runcmd("bg fill");  return; }
    }
}
menu_1 = {
    value: mc.newSimpleForm(),
    set:function(){
        this.value.setTitle("Building Gadgets");
        this.value.addButton("Confirm");
        this.value.addButton("deny");
    },
    callBack(player, id){
        if(id == 0){ player.runcmd("bg confirm");return; }
        if(id == 1){ player.runcmd("bg deny");   return; }
    }
}

// Profile 仅建筑者拥有, 用name识别
Profile = {}
ProfileTool = {
    // 创建
    create:function(name){
        var path = this.getPath(name);
        if(!file.exists(path)){
            file.writeTo(path, JSON.stringify(this.defaultProfile, null , '\t'));
            return true;
        }
        return false;
    },
    // 移除
    remove:function(name){
        var path = this.getPath(name);
        if(file.exists(path)){
            this.release(name);
            file.delete(path);
            return true;
        }
        return false;
    },
    // 重置
    reset:function(name){
        var path = this.getPath(name);
        if(file.exists(path)){
            file.writeTo(path, JSON.stringify(this.defaultProfile, null , '\t'));
            return true;
        }
        return false;
    },
    // 保存
    save:function(name){
        if(Profile[name] != null){
            file.writeTo(this.getPath(name), JSON.stringify(Profile[name], null , '\t'));
            return true;
        }
        return false;
    },
    // 加载
    load:function(name){
        var path = this.getPath(name);
        if(file.exists(path)){
            Profile[name] = JSON.parse(file.readFrom(path));
            return true;
        }
        return false;
    },
    // 释放
    release:function(name){
        if(Profile[name]){
            this.save(name);
            delete Profile[name];
            return true;
        }
        return false;
    },
    // 获取
    get:function(name){
        if(Profile[name] != null){
            return Profile[name];
        }
        if(file.exists(this.getPath(name))){
            this.load(name);
            return Profile[name];
        }
        return null;
    },
    // 判断玩家是否拥有档案(即是否是建筑者)
    has_profile(name){
        if(name != null && file.exists(this.getPath(name))){
            return true;
        }
        return false;
    },
    getPath(name){
        return PLUGIN_PATH + "Profile/" + name + ".json";
    },
    getMoney(pl){
        if (Config.money.type == "score") {
			return pl.getScore(Config.money.name);
		}
		else if (Config.money.type == "LLMoney") {
			return money.get(pl.xuid);
		}
		else {
			logger.error("Failed to get player data: money. Invalid money type.(\'score\' or \'LLMoney\')");
			return null;
		}
    },
    setMoney(pl, money){
        if(Config.money.type == "score"){
            return (pl.setScore(Config.money.name, money) != null);
        }
        else if(Config.money.type == "LLMoney"){
            return money.set(pl.xuid, money);
        }
        else{
            logger.error("Failed to set player data: money.\n  Invalid money type.(\'score\' or \'LLMoney\')");
            return false;
        }
    },
    defaultProfile:{
        // 当前状态
        /*
         * default: 默认
         * copy:    正在进行复制操作
         * paste:   正在进行粘贴操作
         * fill:    正在进行填充操作
         */
        "status" : "default",

        // 当前选区
        "select":{
            "locate"  : [0,0,0], // 最近一个保存操作的定位点位置
            "previous": [0,0,0], // 玩家的上个位置
            "pos1"    : [0,0,0], 
            "pos2"    : [1,1,1]
        },
        // 剪贴板, 保存着一个结构
        "schematic":{
        }
    }
}

// Command
/*
 * bgop
 *  setbuilder [player_name] 将玩家[player_name]设为建筑者
 *  removebuilder [player_name] 取消玩家[player_name]的建筑者身份
 *  resetprofile [player_name] 重置玩家[player_name]的档案
 */
CommandManager = {
    set:function(){
        this.bgop.set();
        this.bg.set();
    },
    // 管理指令
    bgop:{
        cmd:mc.newCommand("bgop", "Building Gadgets - op", PermType.GameMasters),
        set:function(){
            this.param();
            this.cmd.setCallback((_cmd, _ori, out, res) => {
                if(res.setbuilder)    return this.setbuilder    (_cmd, _ori, out, res); // 设置建筑者
                if(res.removebuilder) return this.removebuilder (_cmd, _ori, out, res); // 取消建筑者
                if(res.resetprofile)  return this.resetprofile  (_cmd, _ori, out, res); // 重置建筑者档案
            });
            this.cmd.setup();
        },
        param:function(){
            /// 通用选项 ///
            this.cmd.mandatory("player_name"   , ParamType.String                );

            /// 指令注册 ///
            // setbuilder
            this.cmd.setEnum  ("e_setbuilder"   , ["setbuilder"   ]); this.cmd.mandatory("setbuilder"    , ParamType.Enum, "e_setbuilder"   , 1 );
            this.cmd.overload (["setbuilder"    , "player_name"]);
            // removebuilder
            this.cmd.setEnum  ("e_removebuilder", ["removebuilder"]); this.cmd.mandatory("removebuilder" , ParamType.Enum, "e_removebuilder", 1 );
            this.cmd.overload (["removebuilder" , "player_name"]);
            // resetprofile
            this.cmd.setEnum  ("e_resetprofile" , ["resetprofile"]);  this.cmd.mandatory("resetprofile"  , ParamType.Enum, "e_resetprofile" , 1 );
            this.cmd.overload (["resetprofile"  , "player_name"]);
        },
        setbuilder:function(_cmd, _ori, out, res){
            if(res.player_name){
                if(ProfileTool.create(res.player_name)){
                    return out.success(`Success: Player ${res.player_name} is now a builder.`);
                }
                return out.success(`Failed: Player ${res.player_name} is already a builder.`);
            }
            return out.error("Unknown command.");
        },
        removebuilder:function(_cmd, _ori, out, res){
            if(res.player_name){
                if(ProfileTool.remove(res.player_name)){
                    return out.success(`Success: Player ${res.player_name} is now cancelled builder.`);
                }
                return out.success(`Failed: Player ${res.player_name} is not a builder.`);
            }
            return out.error("Unknown command.");
        },
        resetprofile:function(_cmd, _ori, out, res){
            if(res.player_name){
                if(ProfileTool.reset(res.player_name)){
                    return out.success(`Success: Profile of ${res.player_name} has been reset.`);
                }
                return out.success(`Failed: Player ${res.player_name} is not a builder.`);
            }
            return out.error("Unknown command.");
        }
    },
    // 玩家指令
    bg:{
        cmd: mc.newCommand("bg", "Building Gadgets - player", PermType.Any),
        set:function(){
            this.param();
            this.cmd.setCallback((_cmd, _ori, out, res) => {
                if(res.pos1)   return this.pos1   (_cmd, _ori, out, res);
                if(res.pos2)   return this.pos2   (_cmd, _ori, out, res);

                if(res.copy)   return this.copy   (_cmd, _ori, out, res);
                if(res.paste)  return this.paste  (_cmd, _ori, out, res);
                if(res.fill)   return this.fill   (_cmd, _ori, out, res); // 使用物品栏第一格的物品填充选区

                if(res.confirm)return this.confirm(_cmd, _ori, out, res);
                if(res.deny)   return this.deny   (_cmd, _ori, out, res);

                if(res.getmainhand)   return this.getmainhand   (_cmd, _ori, out, res);
                if(res.getdownblock)  return this.getdownblock  (_cmd, _ori, out, res);
            });
            this.cmd.setup();
        },
        param:function(){
            /// 通用选项 ///

            /// 指令注册 ///
            // pos1
            this.cmd.setEnum  ("e_pos1"   , ["pos1"   ]); this.cmd.mandatory("pos1"    , ParamType.Enum, "e_pos1"   , 1 );
            this.cmd.overload (["pos1"]);
            // pos2
            this.cmd.setEnum  ("e_pos2"   , ["pos2"   ]); this.cmd.mandatory("pos2"    , ParamType.Enum, "e_pos2"   , 1 );
            this.cmd.overload (["pos2"]);
            
            // copy
            this.cmd.setEnum  ("e_copy"   , ["copy"   ]); this.cmd.mandatory("copy"    , ParamType.Enum, "e_copy"   , 1 );
            this.cmd.overload (["copy"]);
            // paste
            this.cmd.setEnum  ("e_paste"  , ["paste"  ]); this.cmd.mandatory("paste"   , ParamType.Enum, "e_paste"  , 1 );
            this.cmd.overload (["paste"]);
            // fill
            this.cmd.setEnum  ("e_fill"  , ["fill"  ]); this.cmd.mandatory("fill"   , ParamType.Enum, "e_fill"  , 1 );
            this.cmd.overload (["fill"]);

            // confirm
            this.cmd.setEnum  ("e_confirm"  , ["confirm"  ]); this.cmd.mandatory("confirm"   , ParamType.Enum, "e_confirm"  , 1 );
            this.cmd.overload (["confirm"]);
            // deny
            this.cmd.setEnum  ("e_deny"     , ["deny"     ]); this.cmd.mandatory("deny"      , ParamType.Enum, "e_deny"     , 1 );
            this.cmd.overload (["deny"]);
            
            // getMainHand
            this.cmd.setEnum  ("e_getmainhand"     , ["getmainhand"     ]); this.cmd.mandatory("getmainhand"      , ParamType.Enum, "e_getmainhand"     , 1 );
            this.cmd.overload (["getmainhand"]);
            // getMainHand
            this.cmd.setEnum  ("e_getdownblock"     , ["getdownblock"     ]); this.cmd.mandatory("getdownblock"      , ParamType.Enum, "e_getdownblock"     , 1 );
            this.cmd.overload (["getdownblock"]);

        },
        pos1:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status == "default"){
                    var pos = [Math.floor(_ori.player.pos.x), Math.floor(_ori.player.pos.y), Math.floor(_ori.player.pos.z)];
                    profile["select"]["pos1"] = pos;
                    return out.success(`Get pos1: (${pos[0]}, ${pos[1]}, ${pos[2]})`);
                }
                return out.error("There is an operation waiting to be processed.");
            }
            return out.error("This command is only for builder.");
        },
        pos2:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status == "default"){
                    var pos = [Math.floor(_ori.player.pos.x), Math.floor(_ori.player.pos.y), Math.floor(_ori.player.pos.z)];
                    profile["select"]["pos2"] = pos;
                    return out.success(`Get pos2: (${pos[0]}, ${pos[1]}, ${pos[2]})`);
                }
                return out.error("There is an operation waiting to be processed.");
            }
            return out.error("This command is only for builder.");
        },
        
        copy:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status == "default"){
                    var size = (Math.abs(profile["select"]["pos1"][0] - profile["select"]["pos2"][0]) + 1)
                             * (Math.abs(profile["select"]["pos1"][1] - profile["select"]["pos2"][1]) + 1)
                             * (Math.abs(profile["select"]["pos1"][2] - profile["select"]["pos2"][2]) + 1);
                    if(size > Config.copy.maxSize)
                        return out.error(`Selected area size ${size} is larger then max size ${Config.copy.maxSize}, please reduce.`);
                    
                    profile.status = "copy";
                    return out.success(`Use "/bg confirm" to execute Copy from (${profile["select"]["pos1"][0]},${profile["select"]["pos1"][1]},${profile["select"]["pos1"][2]}) to (${profile["select"]["pos2"][0]},${profile["select"]["pos2"][1]},${profile["select"]["pos2"][2]}), "/bg deny" to cancel.`);
                }
                return out.error("There is an operation waiting to be processed.");
            }
            return out.error("This command is only for builder.");
        },
        paste:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status == "default"){
                    var posx = profile["select"]["locate"][0] + Math.floor(_ori.player.pos.x) - profile["select"]["previous"][0];
                    var posy = profile["select"]["locate"][1] + Math.floor(_ori.player.pos.y) - profile["select"]["previous"][1];
                    var posz = profile["select"]["locate"][2] + Math.floor(_ori.player.pos.z) - profile["select"]["previous"][2];
                    var posx_end = posx + profile["schematic"]["size"][0];
                    var posy_end = posy + profile["schematic"]["size"][1];
                    var posz_end = posz + profile["schematic"]["size"][2];
                    var cost = profile["schematic"]["size"][0] * profile["schematic"]["size"][1] * profile["schematic"]["size"][2] * Config.copy.cost;
                    profile.status = "paste";
                    return out.success(`Use "/bg confirm" to execute Paste from (${posx},${posy},${posz}) to (${posx_end},${posy_end},${posz_end}), cost $${cost}, "/bg deny" to cancel.`);
                }
                return out.error("There is an operation waiting to be processed.");
            }
            return out.error("This command is only for builder.");
        },
        fill:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status == "default"){
                    var size = (Math.abs(profile["select"]["pos1"][0] - profile["select"]["pos2"][0]) + 1)
                             * (Math.abs(profile["select"]["pos1"][1] - profile["select"]["pos2"][1]) + 1)
                             * (Math.abs(profile["select"]["pos1"][2] - profile["select"]["pos2"][2]) + 1);
                    if(size > Config.fill.maxSize)
                        return out.error(`Selected area size ${size} is larger then max size ${Config.fill.maxSize}, please reduce.`);

                    profile.status = "fill";
                    return out.success(`Please move the blocks you want to place to the first inventory unit, then use "/bg confirm" to execute fill, "/bg deny" to cancel.`
                                        +`\n - Item in your first inventory unit now is: ${_ori.player.getInventory().getItem(0).type}.`
                                        +`\n - Area you selected is (${profile["select"]["pos1"][0]},${profile["select"]["pos1"][1]},${profile["select"]["pos1"][2]}) to (${profile["select"]["pos2"][0]},${profile["select"]["pos2"][1]},${profile["select"]["pos2"][2]}).`
                                        +`\n - This may cost $${Config.fill.cost * size}.`);
                                        
                }
                return out.error("There is an operation waiting to be processed.");
            }
            return out.error("This command is only for builder.");
        },

        confirm:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status == "copy"){
                    var pos = [Math.floor(_ori.player.pos.x), Math.floor(_ori.player.pos.y), Math.floor(_ori.player.pos.z)];
                    profile["select"]["locate"]   = [ Math.min(profile["select"]["pos1"][0], profile["select"]["pos2"][0]),
                                                      Math.min(profile["select"]["pos1"][1], profile["select"]["pos2"][1]),
                                                      Math.min(profile["select"]["pos1"][2], profile["select"]["pos2"][2])];
                    profile["select"]["previous"] = pos;
                    profile["schematic"] = Structure.get(
                        profile["select"]["pos1"][0], profile["select"]["pos1"][1], profile["select"]["pos1"][2],
                        profile["select"]["pos2"][0], profile["select"]["pos2"][1], profile["select"]["pos2"][2],
                        _ori.player.pos.dimid, _ori.player
                    );
                    // 生成耗材描述
                    var listDescription = "";
                    for(var listItem of profile["schematic"]["list"]){
                        listDescription += `  ${listItem["type"]}:${listItem["tiledata"]} × ${listItem["amount"]}\n`;
                    }
                    profile.status = "default";
                    return out.success("Structure has been copied:\n" + listDescription);
                }
                else if(profile.status == "paste"){
                    var posx = profile["select"]["locate"][0] + Math.floor(_ori.player.pos.x) - profile["select"]["previous"][0];
                    var posy = profile["select"]["locate"][1] + Math.floor(_ori.player.pos.y) - profile["select"]["previous"][1];
                    var posz = profile["select"]["locate"][2] + Math.floor(_ori.player.pos.z) - profile["select"]["previous"][2];
                    var cost = profile["schematic"]["size"][0] * profile["schematic"]["size"][1] * profile["schematic"]["size"][2] * Config.copy.cost;
                    var money = ProfileTool.getMoney(_ori.player);
                    if(money >= cost){
                        var placedInFact = Structure.set(posx, posy, posz, _ori.player.pos.dimid, profile["schematic"], _ori.player);
                        var costInFact = Config.copy.cost * placedInFact;
                        ProfileTool.setMoney(_ori.player, money - costInFact);
                        profile.status = "default";
                        return out.success(`Finished, ${placedInFact} blocks have been placed, cost ${costInFact}.`);
                    }
                    else{
                        return out.error("Not enough money.");
                    }
                }
                else if(profile.status == "fill"){
                    var item = _ori.player.getInventory().getItem(0);
                    var cost = Config.fill.cost * Math.abs((profile["select"]["pos1"][0] - profile["select"]["pos2"][0])
                                      * (profile["select"]["pos1"][1] - profile["select"]["pos2"][1])
                                      * (profile["select"]["pos1"][2] - profile["select"]["pos2"][2]));
                    var money = ProfileTool.getMoney(_ori.player);
                    if(money >= cost){
                        var placedInFact = Structure.fill(
                            profile["select"]["pos1"][0], profile["select"]["pos1"][1], profile["select"]["pos1"][2],
                            profile["select"]["pos2"][0], profile["select"]["pos2"][1], profile["select"]["pos2"][2],
                            _ori.player.pos.dimid, item.type, item.aux, _ori.player);
                        if(placedInFact != -1){
                            var costInFact = Config.copy.cost * placedInFact;
                            ProfileTool.setMoney(_ori.player, money - costInFact);
                            profile.status = "default";
                            return out.success(`Finished, ${placedInFact} blocks have been placed, cost ${costInFact}.`);
                        }
                        return out.error(`This item is not a block: ${item.type}:${item.aux}`);
                    }
                    else{
                        return out.error("Not enough money.");
                    }
                }
                return out.error("No operation is waiting for confirmation.");
            }
            return out.error("This command is only for builder.");
        },
        deny:function(_cmd, _ori, out, res){
            var profile = ProfileTool.get(_ori.player.realName);
            if(profile){
                if(profile.status != "default"){
                    var status = profile.status;
                    profile.status = "default";
                    return out.success(`Operation "${status}" is cancelled.`);
                }
                return out.error("No operation could be cancelled.");
            }
            return out.error("This command is only for builder.");
        },

        getmainhand:function(_cmd, _ori, out, res){
            if(_ori.player){
                var item = _ori.player.getHand();
                logger.info(`${item.type}:${item.aux}`);
                return out.success(`Item in your main hand is: ${item.type}:${item.aux}`);
            }
            return out.error("This command is only for players.");
        },
        getdownblock:function(_cmd, _ori, out, res){
            if(_ori.player){
                var block = mc.getBlock(_ori.player.pos.x - 1, _ori.player.pos.y - 2, _ori.player.pos.z - 1, _ori.player.pos.dimid);
                logger.info(`${block.type}:${block.tileData}`);
                return out.success(`Block down here is: ${block.type}:${block.tileData}`)
            }
            return out.error("This command is only for players.");
        },
        TODO:{
            // 选择十字准星位置
            hpos1:function(){
                
            },
            hpos1:function(){
                    
            }
        }
    }
}
// ============== MC Events ========================
mc.listen("onServerStarted", () => {
    CommandManager.set();
    // Create money scoreboard
    if(Config.money.type == "score"){
        setTimeout(function () {
            let score = mc.getScoreObjective(Config.money.name);
            if (score == null) {
                mc.newScoreObjective(Config.money.name, Config.money.name);
            }
        }, 4000);
    }
    // create log.csv
    if(!File.exists(PLUGIN_PATH + "log.csv")){
        File.writeTo(PLUGIN_PATH + "log.csv", "date,player,operation,dim_id,start_x,start_y,start_z,end_x,end_y,end_z,extra\n");
    }
});
mc.listen('onPreJoin', (pl) => {
    if(Config.autoPermission){
        if(!ProfileTool.get(pl.realName)){
            ProfileTool.create(pl.realName);
        }
    }
    ProfileTool.load(pl.realName);
});
mc.listen('onLeft', (pl) => {
    ProfileTool.save(pl.realName);
});
var onUsePlayer = {};
mc.listen("onUseItemOn", (player, item, block, side) => {
    var xuid = player.xuid;
    if(!onUsePlayer[xuid]){
        onUsePlayer[xuid] = true;
        setTimeout(function () {
			delete onUsePlayer[xuid];
		}, 300)
        var type = item.type;
        // 选区工具(右键)
        if(type == Config.tool.wand){
            var profile = ProfileTool.get(player.realName);
            if(profile){
                if(profile.status == "default"){
                    profile["select"]["pos2"][0] = block.pos.x;
                    profile["select"]["pos2"][1] = block.pos.y;
                    profile["select"]["pos2"][2] = block.pos.z;
                    player.sendText(`Get pos2: (${profile["select"]["pos2"][0]},${profile["select"]["pos2"][1]},${profile["select"]["pos2"][2]})`);
                }
                else{
                    player.sendText("There is an operation waiting to be processed.");
                }
            }
        }
        // 菜单工具
        else if(type == Config.tool.menu){
            var profile = ProfileTool.get(player.realName);
            if(profile){
                if(profile.status == "default"){
                    player.sendForm(menu_0.value, menu_0.callBack);
                }
                else{
                    player.sendForm(menu_1.value, menu_1.callBack);
                }
            }
        }
    }
});
mc.listen('onStartDestroyBlock', (player, block) => {
    var xuid = player.xuid;
    if(!onUsePlayer[xuid]){
        onUsePlayer[xuid] = true;
        setTimeout(function () {
			delete onUsePlayer[xuid];
		}, 300)
        // 选区工具(左键)
        if(player.getHand().type == Config.tool.wand){
            var profile = ProfileTool.get(player.realName);
            if(profile){
                if(profile.status == "default"){
                    profile["select"]["pos1"][0] = block.pos.x;
                    profile["select"]["pos1"][1] = block.pos.y;
                    profile["select"]["pos1"][2] = block.pos.z;
                    player.sendText(`Get pos1: (${profile["select"]["pos1"][0]},${profile["select"]["pos1"][1]},${profile["select"]["pos1"][2]})`);
                }
                else{
                    player.sendText("There is an operation waiting to be processed.");
                }
            }
        }
    }
});

// ============== Base function ====================
Structure = {
    ///// 基础 /////
    // 获取一片区域
    get:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, player){
        // 保证起点坐标xyz小于终点坐标xyz
        var start_x, start_y, start_z, end_x, end_y, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
        }
        if(s_y < e_y){
            start_y = s_y;
            end_y = e_y;
        }
        else{
            start_y = e_y;
            end_y = s_y;
        }
        if(s_z < e_z){
            start_z = s_z;
            end_z = e_z;
        }
        else{
            start_z = e_z;
            end_z = s_z;
        }
        
        // 因为始末都要算, 长度+1
        var x_offset = end_x - start_x + 1;
        var y_offset = end_y - start_y + 1;
        var z_offset = end_z - start_z + 1;
        // 初始化结构json对象
        var structure = {
            "size"    :[x_offset, y_offset, z_offset], // 大小
            "blocks"  :[],                             // 结构
            "list"    :[]                              // 耗材清单
        };

        // 对于区域 start_x, start_y, start_z ~ end_x, end_y, end_z
        ///// 保存方块信息 /////
        var y = start_y;
        var blockI = -1;
        for(var iy = 0; iy < y_offset; iy++){
            var x = start_x;
            for(var ix = 0; ix < x_offset; ix++){
                var z = start_z;
                for(var iz = 0; iz < z_offset; iz++){
                    var blockJson  = {};
                    var bl         = mc.getBlock(x, y, z, dim_id);
                    
                    blockJson["type"]     = bl.type;
                    blockJson["tiledata"] = (bl.tileData == null) ? 0 : bl.tileData;

                    // 含有容器或方块实体则记为空气
                    if(bl.hasContainer() || bl.hasBlockEntity()){
                        blockJson["type"] = "minecraft:air";
                        blockJson["tiledata"] = 0;
                    }

                    // 存储
                    if(blockI != -1 && blockJson["type"]     == structure["blocks"][blockI]["type"]
                                    && blockJson["tiledata"] == structure["blocks"][blockI]["tiledata"])
                    {
                        structure["blocks"][blockI]["amount"] ++;
                    }
                    else{
                        blockI++;
                        structure["blocks"][blockI] = blockJson;
                        structure["blocks"][blockI]["amount"] = 1;
                    }
                    z++;
                }
                x++;
            }
            y++;
        }
        ///// 计算耗材信息 /////
        for(var blockLine of structure["blocks"]){
            if(blockLine["type"] == "minecraft:air") continue;
            var inList = false;
            for(var listItem of structure["list"]){
                if(blockLine["type"] == listItem["type"] && blockLine["tiledata"] == listItem["tiledata"]){
                    listItem["amount"] += blockLine["amount"];
                    inList = true;
                    break;
                }
            }
            if(!inList){
                structure["list"].push({
                    "type"     : blockLine["type"],
                    "tiledata" : blockLine["tiledata"],
                    "amount"   : blockLine["amount"]
                });
            }
        }
        writeLog(`${player.realName},copy,${dim_id},${start_x},${start_y},${start_z},${end_x},${end_y},${end_z}`);
        return structure;
    },
    set:function(start_x, start_y, start_z, dim_id, structure, player){
        var inventory = player.getInventory();
        var placedAmount = 0;
        var end_x = start_x + structure["size"][0] - 1;
        var end_y = start_y + structure["size"][1] - 1;
        var end_z = start_z + structure["size"][2] - 1;
        ///// 获取领地权限 /////
        var noPermissionAreas = Land.getNoPermissionAreas(start_x, start_y, start_z, end_x, end_y, end_z, dim_id, player.xuid);

        ///// 加载方块 /////
        var y = start_y;
        var blocks = structure["blocks"];
        var blockI = -1;
        var finish = 0;

        var onUseIndex      = -1;
        var onUseLeftAmount = 0;
        var onUseInitialAmount = 0;
        var needPlace       = true;
        var hasItem         = false;
        for(var iy = 0; iy < structure["size"][1]; iy++){
            var x = start_x;
            for(var ix = 0; ix < structure["size"][0]; ix++){
                var z = start_z;
                for(var iz = 0; iz < structure["size"][2]; iz++){
                    // 第一次处理或当前方块组已处理完毕
                    if(blockI == -1 || finish >= blocks[blockI]["amount"]){
                        // 处理完毕, 则应用物品栏的消耗
                        if(needPlace == true && hasItem == true && onUseIndex != -1){
                            inventory.removeItem(onUseIndex, onUseInitialAmount - onUseLeftAmount);
                        }
                        // 下一组
                        blockI ++;
                        finish = 0;
                        needPlace = (blocks[blockI]["type"] != "minecraft:air");
                        // 触发寻找物品操作
                        onUseIndex = -1;
                        onUseLeftAmount = 0;
                        hasItem = true;
                    }
                    // 需要放置(非空气方块), 栏内有物品, 且正在消耗的物品栏已空, 则寻找下一个物品栏
                    if(needPlace == true && hasItem == true && onUseLeftAmount == 0){
                        if(onUseIndex != -1){
                            inventory.removeItem(onUseIndex, onUseInitialAmount - onUseLeftAmount);
                        }
                        hasItem = false;
                        onUseIndex = -1;
                        
                        for(var inventoryI = 0; inventoryI <= 35 ; inventoryI ++){
                            var item = inventory.getItem(inventoryI);
                            if(isEqualBlocks(item.type, item.aux, blocks[blockI]["type"], blocks[blockI]["tiledata"])){
                                onUseIndex         = inventoryI;
                                onUseInitialAmount = item.count;
                                onUseLeftAmount    = onUseInitialAmount;
                                hasItem            = true;
                                break;
                            }
                        }
                    }
                    // 消耗背包内物品进行放置, 缺少材料则跳过(hasItem == false), 待放置方块为空气则跳过(needplace == false)
                    if(needPlace){
                        if(hasItem){
                            // 待放置位置为背景方块则放置, 否则跳过
                            initialBlock = mc.getBlock(x, y, z, dim_id);
                            if(isBackgroundBlocks(initialBlock.type, initialBlock.tileData)){
                                // 待放置位置处于领地则跳过
                                var couldPlace = true;
                                for(var area of noPermissionAreas){
                                    if(pointInArea_3D(x,y,z,area[0][0], area[0][1],area[0][2], area[1][0],area[1][1], area[1][2])){
                                        couldPlace = false;
                                        break;
                                    }
                                }
                                if(couldPlace){
                                    mc.setBlock(x, y, z, dim_id, blocks[blockI]["type"], blocks[blockI]["tiledata"]);
                                    placedAmount ++;
                                    onUseLeftAmount --;
                                }
                            }
                        }
                    }
                    finish ++;
                    z++;
                }
                x++;
            }
            y++;
        }
        if(onUseIndex != -1){
            inventory.removeItem(onUseIndex, onUseInitialAmount - onUseLeftAmount);
        }
        player.refreshItems();
        writeLog(`${player.name},paste,${dim_id},${start_x},${start_y},${start_z},${end_x},${end_y},${end_z}`);
        return placedAmount;
    },
    fill:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, type, tiledata, player){
        var inventory = player.getInventory();
        // 保证起点坐标xyz小于终点坐标xyz
        var start_x, start_y, start_z, end_x, end_y, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
        }
        if(s_y < e_y){
            start_y = s_y;
            end_y = e_y;
        }
        else{
            start_y = e_y;
            end_y = s_y;
        }
        if(s_z < e_z){
            start_z = s_z;
            end_z = e_z;
        }
        else{
            start_z = e_z;
            end_z = s_z;
        }
        var x_offset = end_x - start_x + 1;
        var y_offset = end_y - start_y + 1;
        var z_offset = end_z - start_z + 1;

        ///// 获取领地权限 /////
        var noPermissionAreas = Land.getNoPermissionAreas(start_x, start_y, start_z, end_x, end_y, end_z, dim_id, player.xuid);


        var placedAmount = 0;

        var onUseIndex = -1;
        var onUseLeftAmount = 0;
        var hasItem = true;
        var isBlock = true;
        // 开始放置
        var y = start_y;
        for(var iy = 0; iy < y_offset; iy++){
            var x = start_x;
            for(var ix = 0; ix < x_offset; ix++){
                var z = start_z;
                for(var iz = 0; iz < z_offset; iz++){
                    // 第一次处理或正在消耗的物品栏已空, 则寻找下一个物品栏
                    if(onUseLeftAmount == 0){
                        if(onUseIndex != -1){
                            inventory.removeItem(onUseIndex, onUseInitialAmount - onUseLeftAmount);
                        }
                        onUseIndex = -1;
                        var hasItem = false;
                        for(var inventoryI = 0; inventoryI <= 35 ; inventoryI++){
                            var item = inventory.getItem(inventoryI);
                            if(isEqualBlocks(item.type, item.aux, type, tiledata)){
                                onUseIndex         = inventoryI;
                                onUseInitialAmount = item.count;
                                onUseLeftAmount    = onUseInitialAmount;
                                hasItem            = true;
                                break;
                            }
                        }
                        if(!hasItem) break;
                    }
                    // 消耗背包内物品进行放置
                    // 待放置位置为背景方块则放置, 否则跳过
                    initialBlock = mc.getBlock(x, y, z, dim_id);
                    if(isBackgroundBlocks(initialBlock.type, initialBlock.tileData)){
                        // 待放置位置处于领地则跳过
                        var couldPlace = true;
                        for(var area of noPermissionAreas){
                            if(pointInArea_3D(x,y,z,area[0][0], area[0][1],area[0][2], area[1][0],area[1][1], area[1][2])){
                                couldPlace = false;
                                break;
                            }
                        }
                        if(couldPlace){
                            isBlock = mc.setBlock(x, y, z, dim_id, type, tiledata);
                            placedAmount ++;
                            onUseLeftAmount --;
                        }
                    }
                    else{
                        // logger.info(`${initialBlock.type}:${initialBlock.tileData}`)
                    }
                    if(!isBlock) break;
                    z++;
                }
                if(!hasItem) break;
                if(!isBlock) break;
                x++;
            }
            if(!hasItem) break;
            if(!isBlock) break;
            y++;
        }
        if(onUseIndex != -1){
            inventory.removeItem(onUseIndex, onUseInitialAmount - onUseLeftAmount);
        }
        player.refreshItems();
        writeLog(`${player.realName},fill,${dim_id},${start_x},${start_y},${start_z},${end_x},${end_y},${end_z},${type}:${tiledata}`);
        return isBlock ? placedAmount : -1;
    },
    getPath:function(fileName){
        return PLUGIN_PATH + "structures/" + fileName + ".json";
    },
    is_empty:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id){
        // 保证起点坐标xyz小于终点坐标xyz
        var start_x, start_y, start_z, end_x, end_y, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
        }
        if(s_y < e_y){
            start_y = s_y;
            end_y = e_y;
        }
        else{
            start_y = e_y;
            end_y = s_y;
        }
        if(s_z < e_z){
            start_z = s_z;
            end_z = e_z;
        }
        else{
            start_z = e_z;
            end_z = s_z;
        }
        var x_offset = end_x - start_x;
        var y_offset = end_y - start_y;
        var z_offset = end_z - start_z;
        // 对于区域 start_x, start_y, start_z ~ end_x, end_y, end_z
        ///// 查找方块信息 /////
        var y = start_y;
        var blockI = -1;
        for(var iy = 0; iy <= y_offset; iy++){
            var x = start_x;
            for(var ix = 0; ix < x_offset; ix++){
                var z = start_z;
                for(var iz = 0; iz < z_offset; iz++){
                    if(mc.getBlock(x, y, z, dim_id).id != 0) return false;
                    z++;
                }
                x++;
            }
            y++;
        }
        return true;
    }
}
// ============== Tools ============================
// 判断坐标是否在某区域内 (2D, 包含边界)
function pointInArea_2D(x,z,areaStart_x,areaStart_z,areaEnd_x,areaEnd_z){
    if(areaStart_x < areaEnd_x){
        if(x < areaStart_x || areaEnd_x < x){
            return false;
        }
    }
    else{
        if(x < areaEnd_x || areaStart_x < x){
            return false;
        }
    }
    if(areaStart_z < areaEnd_z){
        if(z < areaStart_z || areaEnd_z < z){
            return false;
        }
    }
    else{
        if(z < areaEnd_z || areaStart_z < z){
            return false;
        }
    }
    return true;

}
function pointInArea_3D(x,y,z,areaStart_x,areaStart_y,areaStart_z,areaEnd_x,areaEnd_y,areaEnd_z){
    // logger.info(x + " " + y + " "+ z + " "+ areaStart_x + " " + areaStart_y + " " + areaStart_z + " " + areaEnd_x + " " + areaEnd_y + " "+ areaEnd_z);
    if(areaStart_x < areaEnd_x){
        if(x < areaStart_x || areaEnd_x < x){
            return false;
        }
    }
    else{
        if(x < areaEnd_x || areaStart_x < x){
            return false;
        }
    }
    if(areaStart_y < areaEnd_y){
        if(y < areaStart_y || areaEnd_y < y){
            return false;
        }
    }
    else{
        if(y < areaEnd_y || areaStart_y < y){
            return false;
        }
    }
    if(areaStart_z < areaEnd_z){
        if(z < areaStart_z || areaEnd_z < z){
            return false;
        }
    }
    else{
        if(z < areaEnd_z || areaStart_z < z){
            return false;
        }
    }
    // logger.info("true");
    return true;

}
Land = {
    getNoPermissionAreas:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, xuid){
        if(Config.landPlugin == "iLand"){
            return this.iLand.getNoPermissionAreas(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, xuid);
        }
        return [];
    },
    iLand:{
        /* 
        getLandInRange 获取一个长方体内所有领地
         *  Param:
         *   startpos - Vec3 任意坐标
         *   endpos   - Vec3 任意坐标
         *   dimid    - number 维度ID
         *   noAccessCache - boolean （可选参数）不访问缓存
         *  Return:
         *   table 一个数组, 包含所有符合条件的领地ID
         */
        getLandInRange   : lxl.import("ILAPI_GetLandInRange"),
        /* 
        checkPerm 检查领地权限
         *  Param:
         *   landId - string 领地ID
         *   perm   - string 权限名
         *  Return:
         *   boolean 权限控制项状态
         */
        checkPerm        : lxl.import("ILAPI_CheckPerm"),
        /* 
        isPlayerTrusted 玩家是否被领地信任
         *  Param:
         *   landId - string 领地ID
         *   xuid   - string 玩家XUID
         *  Return:
         *   boolean 是否信任
         */
        isPlayerTrusted  : lxl.import("ILAPI_IsPlayerTrusted"),
        /* 
        isLandOwner 玩家是否是领地主人
         *  Param:
         *   landId - string 领地ID
         *   xuid - string 玩家XUID
         *  Return:
         *   boolean 是否是领地主人
         */
        isLandOwner      : lxl.import("ILAPI_IsLandOwner"),
        /* 
        isLandOperator 玩家是否是领地管理员
         *  Param:
         *   landId - string 领地ID
         *   xuid - string 玩家XUID
         *  Return:
         *   boolean 是否是领地主人
         */
        isLandOperator    : lxl.import("ILAPI_IsLandOperator"),
        /* 
        getRange 获取领地对角坐标
         *  Param:
         *   landId - string 领地ID
         *  Return:
         *   AABB 表示领地范围
         */
        getRange          : lxl.import("ILAPI_GetRange"),
        couldPlace(xuid, landId){
            if(this.isLandOwner(landId, xuid))        return true;
            if(this.isLandOperator(landId, xuid))     return true;
            if(this.isPlayerTrusted(landId,xuid))     return true;
            if(this.checkPerm(landId, "allow_place")) return true;
            return false;
        },
        getNoPermissionAreas(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, xuid){
            var landIdArray = this.getLandInRange({x: s_x, y: s_y, z: s_z}, {x: e_x, y: e_y, z: e_z}, dim_id);
            var noPermissionAreas = [];
            for(var landId of landIdArray){
                if(!this.couldPlace(xuid, landId)){
                    var range = this.getRange(landId);
                    noPermissionAreas.push([[range.posA.x, range.posA.y, range.posA.z],[range.posB.x, range.posB.y, range.posB.z]]);
                }
            }
            return noPermissionAreas;
        }
    }
}

function writeLog(msg){
    var date = new Date();
    var dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    var logPath = PLUGIN_PATH + "log.csv";

    if(File.getFileSize(logPath) > 10000000){// 10MB
        File.move(logPath, PLUGIN_PATH + "logs/log " + dateString + ".csv");
        File.writeTo(logPath, "date,player,operation,dim_id,start_x,start_y,start_z,end_x,end_y,end_z,extra\n");
    }
    File.writeLine(logPath, `${dateString},${msg}`);
}
// ============== Data ============================
equalBlocks = [];
function isEqualBlocks(item_type, item_tileData, block_type, block_tileData){
    // just equal
    if(item_type == block_type && item_tileData == block_tileData) return true;
    // stairs (0 == 0~7)
    if(block_type.search("stairs") != -1){
        if(item_type == block_type)
            return true;
    }
    // setting
    for(var group of equalBlocks){
        if(group[0][0] == block_type && (group[0][1] == -1 || group[0][1] == block_tileData)){
            if(group[1][0] == item_type && (group[1][1] == -1 || group[1][1] == item_tileData)){
                return true;
            }
        }
    }
    return false;
}
backgroundBlocks = [["minecraft:air", -1], ["minecraft:water", -1]];
function isBackgroundBlocks(type, tileData){
    for(var blocks of backgroundBlocks){
        if(blocks[0] == type){
            if(blocks[1] == -1 || blocks[1] == tiledata){
                return true;
            }
        }
    }
    return false;
}
function loadData(){
    // 判断文件是否存在, 不存在则以默认配置创建
    if(!file.exists(PLUGIN_PATH + "/data/block2Item.json")) {
        file.writeTo(PLUGIN_PATH + "/data/block2Item.json", JSON.stringify([] , null , '\t'));
    }
    if(!file.exists(PLUGIN_PATH + "/data/backgroundBlocks.json")) {
        file.writeTo(PLUGIN_PATH + "/data/backgroundBlocks.json", JSON.stringify([["minecraft:air", -1], ["minecraft:water", -1]] , null , '\t'));
    }
    equalBlocks = JSON.parse(file.readFrom(PLUGIN_PATH + "/data/block2Item.json"));
    backgroundBlocks = JSON.parse(file.readFrom(PLUGIN_PATH + "/data/backgroundBlocks.json"));
}

load();