
// ==================== Title ====================

  /* ---------------------------------------- *\
   *  Name        :  WheatBuilder             *
   *  Description :  A plugin for move chunk  *
   *  Version     :  0.1.1                    *
   *  Author      :  ENIAC_Jushi              *
  \* ---------------------------------------- */

// ==================== Docs =======================
/* [区块文件的格式] 
一个区块文件至少包含一个区块
[
  {
      position:[x,z],         // 该区块在区块组中的位置
      structure:[
        size: [x, y, z],
        entities:[
          {
            type: "",         // 命名空间
            position:[x,y,z], // 相对结界起点位置
            NBT:[],           // NBT
            
            container:"",     // 容器
            tags:[]           // 标签
          }
      ]
      blocks:[
          {
            NBT:"",
            container:[],
            entity:"",
            amount:n         // 重复n次
          }
        ] // 包含方块的数据值, 即箱子和告示牌的字
      ]
  }
]
*/
/* [处理文件的格式]
[
    {
        type:"save",
        fileName:"",      // 文件名, 包含拓展名
        startChunk:[x,z], // 作为参照计算相对位置的区块坐标, 维度与被保存的区块一致
        chunks:[
            [x,z,dim]     // 包含的区块坐标
        ]
    },
    {
        type:"load",
        fileName:"",          // 文件名, 包含拓展名
        startChunk:[x,z,dim]  // 起始区块坐标
    }
]
*/
// ================== Initialize ===================
var PLUGIN_PATH = "plugins/WheatBuilder/";
let version = 0.1
function load(){
    // logger output
    logger.setConsole(true);
    logger.setTitle('WB');
    logger.info('Wheat Builder is running');
    Config.load();
    logger.info(Config.toString());
    setMenu();
    // floder
    if(!file.exists(PLUGIN_PATH)) {
        file.mkdir(PLUGIN_PATH);
    }
}
Config = {
    tool:{
        wand:"minecraft:wooden_hoe",
        menu:"minecraft:wooden_shovel"
    },
    openWE:false,
    load:function(){
        // 判断文件是否存在, 不存在则以默认配置创建
        if(!file.exists(PLUGIN_PATH + "config.json")) {
            file.writeTo(PLUGIN_PATH + "config.json", JSON.stringify({
                "tool":{
                    "wand"         : "minecraft:wooden_hoe",   // 选区工具
                    "menu"         : "minecraft:wooden_shovel" // 菜单工具
                },
                "openWE": false,
                "dataPath":"plugins/WheatBuilder/"
            } , null , '\t'));
            setTimeout(() => { logger.info('未找到配置文件，以默认配置启动'); }, 6000);
        }

        var c = JSON.parse(file.readFrom(PLUGIN_PATH + "config.json"));
        Config.tool.wand = c["tool"]["wand"];
        Config.tool.menu = c["tool"]["menu"];
        Config.openWE    = c["openWE"];
        PLUGIN_PATH      = c["dataPath"];
    },
    toString:function(){
        return "Loading...\n\n   =====================================\n"
        + "\t[tool]\n"
        + "\t  wand:\t"          + Config.tool.wand                + "\n"
        + "\t  menu:\t"          + Config.tool.menu                + "\n"
        + "\tWE:\t"              + Config.openWE                   + "\n"
        + "   =====================================\n";
    }
}
var menu = mc.newSimpleForm();
function setMenu(){
    menu.setTitle("Wheat Builder");
    menu.addButton("Copy");
    menu.addButton("Paste");
}
function menuCallBack(player, id){
    if(id != null){
        logger.debug(id);
        if(id == 0){ player.runcmd("copy");  return; }
        if(id == 1){ player.runcmd("paste"); return; }
    }
}
// Profile 仅建筑者拥有, 用name识别
Profile = {}
ProfileTool = {
    // 创建
    create:function(name){
        if(!file.exists(PLUGIN_PATH + "Profile/" + name + ".json")){
            file.writeTo(PLUGIN_PATH + "Profile/" + name + ".json", JSON.stringify(this.defaultProfile, null , '\t'));
            return true;
        }
        return false;
    },
    // 移除
    remove:function(name){
        if(file.exists(PLUGIN_PATH + "Profile/" + name + ".json")){
            this.release(name);
            file.delete(PLUGIN_PATH + "Profile/" + name + ".json");
            return true;
        }
        return false;
    },
    // 重置
    reset:function(name){
        if(file.exists(PLUGIN_PATH + "Profile/" + name + ".json")){
            file.writeTo(PLUGIN_PATH + "Profile/" + name + ".json", JSON.stringify(this.defaultProfile, null , '\t'));
            return true;
        }
        return false;
    },
    // 保存
    save:function(name){
        if(Profile[name] != null){
            file.writeTo(PLUGIN_PATH + "Profile/" + name + ".json", JSON.stringify(Profile[name], null , '\t'));
            return true;
        }
        return false;
    },
    // 加载
    load:function(name){
        var fileName = PLUGIN_PATH + "Profile/" + name + ".json";
        if(file.exists(fileName)){
            Profile[name] = JSON.parse(file.readFrom(fileName));
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
        if(file.exists(PLUGIN_PATH + "Profile/" + name + ".json")){
            this.load(name);
            return Profile[name];
        }
        return null;
    },
    // 判断玩家是否拥有档案(即是否是建筑者)
    has_profile(name){
        if(name != null && file.exists(PLUGIN_PATH + "Profile/" + name + ".json")){
            return true;
        }
        return false;
    },
    defaultProfile:{
        // 当前选区
        "select":{
            "type"    : "cube" ,
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
CommandManager = {
    set:function(){
        this.wb.set();
        if(Config.openWE){
            this.select.set();
            this.structure.set();
        }
    },
    // 特色功能(雾)及设置
    wb:{
        cmd:mc.newCommand("wb", "Wheat Builder", PermType.GameMasters),
        set:function(){
            this.param();
            this.cmd.setCallback((_cmd, _ori, out, res) => {
                if(res.area)          return this.area          (_cmd, _ori, out, res); // 保存和加载区域   (自动)
                if(res.setbuilder)    return this.setbuilder    (_cmd, _ori, out, res); // 设置建筑者       (在线)
                if(res.removebuilder) return this.removebuilder (_cmd, _ori, out, res); // 取消建筑者       (在线)
                if(res.resetprofile)  return this.resetprofile  (_cmd, _ori, out, res); // 重置建筑者档案   (在线)
            });
            this.cmd.setup();
        },
        param:function(){
            /// 通用选项 ///
            // 保存
            this.cmd.setEnum  ("e_save"    , ["save"  ]); this.cmd.mandatory("save"    , ParamType.Enum, "e_save", 1 );
            this.cmd.setEnum  ("e_load"    , ["load"  ]); this.cmd.mandatory("load"    , ParamType.Enum, "e_load", 1 );
            // 定位
            this.cmd.mandatory("start_x"       , ParamType.Int                   );
            this.cmd.mandatory("start_y"       , ParamType.Int                   );
            this.cmd.mandatory("start_z"       , ParamType.Int                   );
            this.cmd.mandatory("end_x"         , ParamType.Int                   );
            this.cmd.mandatory("end_y"         , ParamType.Int                   );
            this.cmd.mandatory("end_z"         , ParamType.Int                   );
            this.cmd.mandatory("dim_id"        , ParamType.Int                   );
            // 文件
            this.cmd.mandatory("file_name"     , ParamType.RawText               );
            // 其它
            this.cmd.mandatory("mode"          , ParamType.Int                   );
            this.cmd.mandatory("player_name"   , ParamType.String                );
            /// 指令注册 ///
            // area
            this.cmd.setEnum  ("e_area"    , ["area"  ]); this.cmd.mandatory("area"    , ParamType.Enum, "e_area", 1 );
            this.cmd.overload (["area", "save", "start_x", "start_z", "end_x", "end_z", "dim_id", "file_name", "mode"]);
            this.cmd.overload (["area", "load", "start_x", "start_z", "dim_id" , "file_name"]);
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
        area:function(_cmd, _ori, out, res){
            if(res.save){
                Area.createSaveAreaTask(res.start_x, res.start_z, res.end_x, res.end_z, res.file_name, res.dim_id, res.mode);
                
                return out.success(`Chunk save task created.`);
            }
            if(res.load){
                Area.createLoadAreaTask(res.start_x, res.start_z, res.dim_id, res.file_name);
                
                return out.success(`Chunk load task created.`);
            }
            return out.error("Unknown command.");
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
    // 选区操作
    select:{
        set:function(){
            this.pos1();
            this.pos2();
        },
        // 选择玩家当前位置
        pos1:function(){
            var cmd = mc.newCommand("pos1", "Select cube area with player position.", PermType.Any);
            cmd.overload ();
            cmd.setCallback((_cmd, _ori, out, res) => {
                var profile = ProfileTool.get(_ori.player.realName);
                if(profile){
                    var pos = [Math.floor(_ori.player.pos.x), Math.floor(_ori.player.pos.y), Math.floor(_ori.player.pos.z)];
                    profile["select"]["pos1"] = pos;
                    return out.success(`Get pos1: (${pos[0]}, ${pos[1]}, ${pos[2]})`);
                }
                return out.error("This command is only for builder.");
            });
            cmd.setup();
        },
        pos2:function(){
            var cmd = mc.newCommand("pos2", "Select cube area with player position.", PermType.Any);
            cmd.overload ();
            cmd.setCallback((_cmd, _ori, out, res) => {
                var profile = ProfileTool.get(_ori.player.realName);
                if(profile){
                    var pos = [Math.floor(_ori.player.pos.x), Math.floor(_ori.player.pos.y), Math.floor(_ori.player.pos.z)];
                    profile["select"]["pos2"] = pos;
                    return out.success(`Get pos2: (${pos[0]}, ${pos[1]}, ${pos[2]})`);
                }
                return out.error("This command is only for builder.");
            });
            cmd.setup();
        },
        TODO:{
            // 选择十字准星位置
            hpos1:function(){
                
            },
            hpos1:function(){
                    
            },
            // 选择所在区块
            chunk:function(){
    
            },
            // 使用法杖选择
            wand:function(){
                
            }
        }
    },
    // 结构操作
    structure:{
        set:function(){
            this.copy();
            this.paste();
        },
        copy:function(){
            var cmd = mc.newCommand("copy", "Copy selected area.", PermType.Any);
            cmd.setEnum  ("e_e", ["e"]); cmd.optional("e", ParamType.Enum, "e_e", 1 );
            cmd.overload ();      // 不保存实体
            cmd.overload (["e"]); // 保存实体
            cmd.setCallback((_cmd, _ori, out, res) => {
                var profile = ProfileTool.get(_ori.player.realName);
                if(profile){
                    var pos = [Math.floor(_ori.player.pos.x), Math.floor(_ori.player.pos.y), Math.floor(_ori.player.pos.z)];
                    profile["select"]["locate"]   = [ Math.min(profile["select"]["pos1"][0], profile["select"]["pos2"][0]),
                                                      Math.min(profile["select"]["pos1"][1], profile["select"]["pos2"][1]),
                                                      Math.min(profile["select"]["pos1"][2], profile["select"]["pos2"][2])];
                    profile["select"]["previous"] = pos;
                    profile["schematic"] = Structure.get(
                        profile["select"]["pos1"][0], profile["select"]["pos1"][1], profile["select"]["pos1"][2],
                        profile["select"]["pos2"][0], profile["select"]["pos2"][1], profile["select"]["pos2"][2],
                        _ori.player.pos.dimid , (res.e == null ? 0 : 1)
                      );
                    return out.success("Structure has been copied.");
                }
                return out.error("This command is only for builder.");
            });
            cmd.setup();
        },
        paste:function(){
            var cmd = mc.newCommand("paste", "Paste area", PermType.Any);
            cmd.overload ();
            cmd.setCallback((_cmd, _ori, out, res) => {
                var profile = ProfileTool.get(_ori.player.realName);
                if(profile){
                    var posx = profile["select"]["locate"][0] + Math.floor(_ori.player.pos.x) - profile["select"]["previous"][0];
                    var posy = profile["select"]["locate"][1] + Math.floor(_ori.player.pos.y) - profile["select"]["previous"][1];
                    var posz = profile["select"]["locate"][2] + Math.floor(_ori.player.pos.z) - profile["select"]["previous"][2];
                    Structure.set(posx, posy, posz, _ori.player.pos.dimid, profile["schematic"], true);
                    return out.success("Structure has been pasted.");
                }
                return out.error("This command is only for builder.");
            });
            cmd.setup();
        }
    }
}
// ============== MC Events ========================
mc.listen("onServerStarted", () => {
    CommandManager.set();
});
mc.listen('onPreJoin', (pl) => {
    ProfileTool.load(pl.realName);
});
mc.listen('onLeft', (pl) => {
    ProfileTool.save(pl.realName);
});
var onUsePlayer = {};
mc.listen("onUseItemOn", (player, item, block, side) => {
    if(!Config.openWE) return;
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
                profile["select"]["pos2"][0] = block.pos.x;
                profile["select"]["pos2"][1] = block.pos.y;
                profile["select"]["pos2"][2] = block.pos.z;
                player.sendText(`Get pos2: (${profile["select"]["pos2"][0]},${profile["select"]["pos2"][1]},${profile["select"]["pos2"][2]})`);
            }
        }
        // 菜单工具
        else if(type == Config.tool.menu){
            var profile = ProfileTool.get(player.realName);
            if(profile){
                player.sendForm(menu, menuCallBack)
            }
        }
    }
});
mc.listen('onStartDestroyBlock', (player, block) => {
    if(!Config.openWE) return;
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
                profile["select"]["pos1"][0] = block.pos.x;
                profile["select"]["pos1"][1] = block.pos.y;
                profile["select"]["pos1"][2] = block.pos.z;
                player.sendText(`Get pos1: (${profile["select"]["pos1"][0]},${profile["select"]["pos1"][1]},${profile["select"]["pos1"][2]})`);
            }
        }
    }
});

// ============== Base function ====================
// [区域] 由多个区块组成的集合, 这些区块合并后是一个长方体
Area = {
    path : PLUGIN_PATH + "Area/",
    
    // 创建一个保存区域的任务
    // s_x,s_z,e_x,e_z : 始末区块的坐标, 起始区块将作为区块组的定位区块,无论它是否处于西北角
    // max_ticking_area: 可创建的常加载区域的数量, 取值为 0 ~ 10, 为0代表不自动创建
    // speed:          : 检测区域是否被加载的时间间隔(单位为1 tick, 即50ms)
    createSaveAreaTask:function(s_x, s_z, e_x, e_z, floder_name , dim_id, mode){
        var start_x, start_z, end_x, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
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
        var z_offset = end_z - start_z + 1;

        // 规划任务执行, 一个常加载区域最多有100个区块
        // 每步保存的任务结构:[start_x, start,z, end_x, end_z, dim_id]
        var area_process_list = [];
        // 先覆盖10*10的区域
        var x_amount = Math.floor(x_offset / 10); // x方向边长为10的区域数量 →
        var z_amount = Math.floor(z_offset / 10); // z方向边长为10的区域数量 ↓
        for(var ix = 0; ix < x_amount; ix++){
            for(var iz = 0; iz < z_amount; iz++){
                var sx = start_x + ix * 10;
                var sz = start_z + iz * 10;
                area_process_list.push([sx, sz, sx + 9, sz + 9, dim_id]);
            }
        }
        // 然后覆盖边角区域, 先x后z
        var side_offset_z = z_offset - z_amount * 10; // z方向的边角区块长度
        // 处理x →
        if(side_offset_z > 0){
            var x_start  = start_x;                 // 当前处理区域的起始区块坐标x
            var z_start  = start_z + z_amount * 10; // 当前处理区域的起始区块坐标z
            var x_left   = x_offset;                // 待处理的x方向长度
            var x_max    = Math.floor(100 / side_offset_z) - 1;     // 一次推进的最大长度
            while(true){
                if(x_left <= 0){
                    break;
                }
                else{
                    if(x_left >= x_max){
                        area_process_list.push([x_start, z_start, x_start + x_max, end_z, dim_id]);
                        x_start += x_max;
                        x_left  -= x_max;
                    }
                    else{
                        area_process_list.push([x_start, z_start, x_start + x_left, end_z, dim_id]);
                        x_start += x_left;
                        x_left  -= x_left;
                    }
                }
            }
        }
        // 处理z →
        var side_offset_x = x_offset - x_amount * 10; // x方向的边角区块长度
        if(side_offset_x > 0){
            var x_start  = start_x + x_amount * 10; // 当前处理区域的起始区块坐标x
            var z_start  = start_z;                 // 当前处理区域的起始区块坐标z
            var z_left   = z_amount * 10;           // 待处理的z方向长度
            var z_max    = Math.floor(100 / side_offset_x) - 1;     // 一次推进的最大长度
            while(true){
                if(z_left <= 0){
                    break;
                }
                else{
                    if(z_left >= z_max){
                        area_process_list.push([x_start, z_start, end_x, z_start + z_max, dim_id]);
                        z_start += z_max;
                        z_left  -= z_max;
                    }
                    else{
                        area_process_list.push([x_start, z_start, end_x, z_start + z_left, dim_id]);
                        z_start += z_left;
                        z_left  -= z_left;
                    }
                }
            }
        }
        // 任务
        var status = 0; // 状态, 0为开始处理, 1为等待加载
        const onProcess_locate_x = start_x;
        const onProcess_locate_z = start_z;
        var onProcess_i = 0;
        var onProcess_start_x;
        var onProcess_start_z;
        var onProcess_end_x;
        var onProcess_end_z;
        logger.info(JSON.stringify(area_process_list));
        var taskId = setInterval(() => {
            // 获取当前的任务组
            if(status == 0){
                if(onProcess_i == area_process_list.length){
                    logger.info("task finished.");
                    clearInterval(taskId);
                    return;
                }
                // 跳过已加载的区块
                if(file_exists(`/Area/${floder_name}/${onProcess_i}.json`)){
                    logger.info(`Skip "${floder_name}/${onProcess_i}"`);
                    onProcess_i ++;
                    return;
                }
                else{
                    onProcess_start_x = area_process_list[onProcess_i][0];
                    onProcess_start_z = area_process_list[onProcess_i][1];
                    onProcess_end_x   = area_process_list[onProcess_i][2];
                    onProcess_end_z   = area_process_list[onProcess_i][3];
                    logger.info(`/tickingarea add ${onProcess_start_x * 16 } -64 ${onProcess_start_z * 16 } ${onProcess_end_x * 16 + 8} 320 ${onProcess_end_z * 16 + 15} movechunk${onProcess_i}`);
                    runCmd(dim_id, `tickingarea add ${onProcess_start_x * 16 } -64 ${onProcess_start_z * 16 } ${onProcess_end_x * 16 + 8} 320 ${onProcess_end_z * 16 + 15} movechunk${onProcess_i}`);

                    status = 1;
                    logger.info(`save chunks from ${onProcess_start_x}, ${onProcess_start_z} to ${onProcess_end_x}, ${onProcess_end_z}...`);
                }
            }
            else if(status == 1){
                var ticked = true;
                for(var tick_x = onProcess_start_x; tick_x <= onProcess_end_x; tick_x ++){
                    for(var tick_z = onProcess_start_z; tick_z <= onProcess_end_z; tick_z ++){
                        if(Chunk.is_empty(tick_x, tick_z, dim_id)){
                            ticked = false;
                            break;
                        }
                    }
                    if(ticked == false) break;
                }
                // 保存
                if(ticked){
                    var area = Area.get(onProcess_start_x, onProcess_start_z, onProcess_end_x, onProcess_end_z, dim_id, onProcess_locate_x, onProcess_locate_z, mode);
                    Chunk.saveGroup(area, `Area/${floder_name}/${onProcess_i}.json`);
                    runCmd(`tickingarea remove movechunk${onProcess_i}`);
                    logger.info(`chunks from ${onProcess_start_x}, ${onProcess_start_z} to ${onProcess_end_x}, ${onProcess_end_z} has been saved.`);
                    status = 0;
                    onProcess_i ++;
                }
            }
        }, 1000);
    },
    // 创建一个加载区域的任务
    createLoadAreaTask:function(start_x, start_z, dim_id, floder_name){
        if(file_exists(`Area/${floder_name}/0.json`)){
            // 任务
            var status = 0; // 状态, 0为开始处理, 1为等待加载
            var onProcess_i = 0;
            var areaUnit = [];
            var onProcess_start_x;
            var onProcess_start_z;
            var onProcess_end_x;
            var onProcess_end_z;
            var emptyTryAmount = 0;
            var taskId = setInterval(() => {
                // 获取当前的任务组
                if(status == 0){
                    // 处理下一个区域单元
                    if(file_exists(`/Area/${floder_name}/${onProcess_i}.json`)){
                        // 加载区域
                        areaUnit = Chunk.loadGroup(`Area/${floder_name}/${onProcess_i}.json`);
                        onProcess_start_x = start_x + areaUnit[0]["position"][0];
                        onProcess_start_z = start_z + areaUnit[0]["position"][1];
                        onProcess_end_x   = start_x + areaUnit[areaUnit.length - 1]["position"][0];
                        onProcess_end_z   = start_z + areaUnit[areaUnit.length - 1]["position"][1];
                        
                        logger.info(`tickingarea add ${onProcess_start_x * 16 + 8} 0 ${onProcess_start_z * 16 + 8} ${onProcess_end_x * 16 + 8} 0 ${onProcess_end_z * 16 + 8} movechunk${onProcess_i}`);
                        runCmd(dim_id, `tickingarea add ${onProcess_start_x * 16 + 8} 0 ${onProcess_start_z * 16 + 8} ${onProcess_end_x * 16 + 8} 0 ${onProcess_end_z * 16 + 8} movechunk${onProcess_i}`);
                        
                        status = 1;
                        logger.info(`load area unit ${onProcess_i} ...`);
                    }
                    // 没有更多文件读取, 任务结束
                    else{
                        logger.info("task finished.");
                        clearInterval(taskId);
                        return;
                    }
                }
                // 等待区域加载
                else if(status == 1){
                    var ticked = true;
                    for(var tick_x = onProcess_start_x; tick_x <= onProcess_end_x; tick_x ++){
                        for(var tick_z = onProcess_start_z; tick_z <= onProcess_end_z; tick_z ++){
                            if(Chunk.is_empty(tick_x, tick_z, dim_id)){
                                ticked = false;
                                break;
                            }
                        }
                        if(ticked == false) break;
                    }
                    if(ticked) status = 2;
                    emptyTryAmount ++;
                    if(emptyTryAmount >= 30) status = 2;
                }
                // 加载第一步, 加载除了最后一列的列
                else if(status == 2){
                    emptyTryAmount = 0;
                    Area.set(start_x, start_z, dim_id, Chunk.loadGroup(`Area/${floder_name}/${onProcess_i}.json`), true, null);
                    // 移除常加载区域, 重设最后一列
                    runCmd(dim_id, `tickingarea remove movechunk${onProcess_i}`);
                    status = 3;
                }
                else if(status == 3){
                    logger.info(`tickingarea add ${onProcess_start_x * 16 + 8} 0 ${onProcess_end_z * 16 + 8} ${onProcess_end_x * 16 + 8} 0 ${onProcess_end_z * 16 + 8} movechunk${onProcess_i}`);
                    runCmd(dim_id, `tickingarea add ${onProcess_start_x * 16 + 8} 0 ${onProcess_end_z * 16 + 8} ${onProcess_end_x * 16 + 8} 0 ${onProcess_end_z * 16 + 8} movechunk${onProcess_i}`);
                    status = 4;
                }
                // 等待区域加载
                else if(status == 4){
                    var ticked = true;
                    for(var tick_x = onProcess_start_x; tick_x <= onProcess_end_x; tick_x ++){
                        for(var tick_z = onProcess_end_z; tick_z <= onProcess_end_z; tick_z ++){
                            if(Chunk.is_empty(tick_x, tick_z, dim_id)){
                                ticked = false;
                                break;
                            }
                        }
                        if(ticked == false) break;
                    }
                    if(ticked) status = 5;
                    emptyTryAmount ++;
                    if(emptyTryAmount >= 30) status = 5;
                }
                // 加载第二步, 加载最后一列
                else if(status == 5){
                    emptyTryAmount = 0;
                    Area.set(start_x, start_z, dim_id, Chunk.loadGroup(`Area/${floder_name}/${onProcess_i}.json`), false, onProcess_end_z);
                    logger.info(`chunks ${floder_name}/${onProcess_i}.json has been loaded at (${onProcess_start_x}, ${onProcess_start_z}).`);
                    runCmd(dim_id, `tickingarea remove movechunk${onProcess_i}`);
                    status = 0;
                    onProcess_i ++;
                }
            }, 1000);
        }
        else{
            logger.info("Area floder not exist.")
        }
    },
    createClearAreaTask:function(s_x, s_z, e_x, e_z, dim_id, clearEntity){
        var start_x, start_z, end_x, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
        }
        if(s_z < e_z){
            start_z = s_z;
            end_z = e_z;
        }
        else{
            start_z = e_z;
            end_z = s_z;
        }
        
        // 规划任务执行, 一个常加载区域最多有100个区块
        // 每步保存的任务结构:[start_x, start,z, end_x, end_z, dim_id]
        var area_process_list = Area.segment(start_x, start_z, end_x, end_z, dim_id);
        
        // 任务
        var status = 0; // 状态, 0为开始处理, 1为等待加载
        const onProcess_locate_x = start_x;
        const onProcess_locate_z = start_z;
        var onProcess_i = 0;
        var onProcess_start_x;
        var onProcess_start_z;
        var onProcess_end_x;
        var onProcess_end_z;
        var emptyTryAmount = 0;
        logger.info(JSON.stringify(area_process_list));
        var taskId = setInterval(() => {
            // 获取当前的任务组
            if(status == 0){
                if(onProcess_i == area_process_list.length){
                    logger.info("task finished.");
                    clearInterval(taskId);
                    return;
                }
                // 跳过已加载的区块
                if(file_exists(`/Area/${floder_name}/${onProcess_i}.json`)){
                    logger.info(`Skip "${floder_name}/${onProcess_i}"`);
                    onProcess_i ++;
                    return;
                }
                else{
                    onProcess_start_x = area_process_list[onProcess_i][0];
                    onProcess_start_z = area_process_list[onProcess_i][1];
                    onProcess_end_x   = area_process_list[onProcess_i][2];
                    onProcess_end_z   = area_process_list[onProcess_i][3];
                    logger.info(`/tickingarea add ${onProcess_start_x * 16 } -64 ${onProcess_start_z * 16 } ${onProcess_end_x * 16 + 8} 320 ${onProcess_end_z * 16 + 15} movechunk${onProcess_i}`);
                    runCmd(dim_id, `tickingarea add ${onProcess_start_x * 16 } -64 ${onProcess_start_z * 16 } ${onProcess_end_x * 16 + 8} 320 ${onProcess_end_z * 16 + 15} movechunk${onProcess_i}`);

                    status = 1;
                    logger.info(`save chunks from ${onProcess_start_x}, ${onProcess_start_z} to ${onProcess_end_x}, ${onProcess_end_z}...`);
                }
            }
            else if(status == 1){
                var ticked = true;
                for(var tick_x = onProcess_start_x; tick_x <= onProcess_end_x; tick_x ++){
                    for(var tick_z = onProcess_start_z; tick_z <= onProcess_end_z; tick_z ++){
                        if(Chunk.is_empty(tick_x, tick_z, dim_id)){
                            ticked = false;
                            break;
                        }
                    }
                    if(ticked == false) break;
                    emptyTryAmount ++;
                    if(emptyTryAmount >= 30) ticked = true;
                }
                // 删除
                if(ticked){
                    Area.clear(onProcess_start_x, onProcess_start_z, onProcess_end_x, onProcess_end_z, dim_id, clearEntity);
                    runCmd(`tickingarea remove movechunk${onProcess_i}`);
                    logger.info(`chunks from ${onProcess_start_x}, ${onProcess_start_z} to ${onProcess_end_x}, ${onProcess_end_z} has been cleared.`);
                    status = 0;
                    onProcess_i ++;
                }
            }
        }, 1000);
    },
    // 面积不大于100的长方形区域, 以locate_x, locate_z为定位点
    get:function(s_x, s_z, e_x, e_z, dim_id, locate_x, locate_z, mode){
        var start_x, start_z, end_x, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
        }
        if(s_z < e_z){
            start_z = s_z;
            end_z = e_z;
        }
        else{
            start_z = e_z;
            end_z = s_z;
        }
        var x_offset = start_x - end_x;
        var z_offset = start_z - end_z;
        // 读取
        var area = [];
        for(var x = start_x; x <= end_x; x++){
            for(var z = start_z; z<=end_z; z++){
                area.push(Chunk.get(x, z, dim_id, x - locate_x, z - locate_z, mode));
            }
        }
        return area;
    },
    set:function(start_x, start_z, dim_id, chunks, entity, zFilter){
        Chunk.setGroup(start_x, start_z, dim_id, chunks, entity, zFilter);
    },
    clear:function(s_x, s_z, e_x, e_z, dim_id, clearEntity){
        var start_x, start_z, end_x, end_z;
        if(s_x < e_x){
            start_x = s_x;
            end_x = e_x;
        }
        else{
            start_x = e_x;
            end_x = s_x;
        }
        if(s_z < e_z){
            start_z = s_z;
            end_z = e_z;
        }
        else{
            start_z = e_z;
            end_z = s_z;
        }
        for(var x = start_x; x <= end_x; x++){
            for(var z = start_z; z<=end_z; z++){
                Chunk.clear(x, z, dim_id, clearEntity);
            }
        }
    },
    segment:function(start_x, start_z, end_x, end_z, dim_id){
        var area_process_list = [];
        var x_offset = end_x - start_x + 1;
        var z_offset = end_z - start_z + 1;
        // 先覆盖10*10的区域
        var x_amount = Math.floor(x_offset / 10); // x方向边长为10的区域数量 →
        var z_amount = Math.floor(z_offset / 10); // z方向边长为10的区域数量 ↓
        for(var ix = 0; ix < x_amount; ix++){
            for(var iz = 0; iz < z_amount; iz++){
                var sx = start_x + ix * 10;
                var sz = start_z + iz * 10;
                area_process_list.push([sx, sz, sx + 9, sz + 9, dim_id]);
            }
        }
        // 然后覆盖边角区域, 先x后z
        var side_offset_z = z_offset - z_amount * 10; // z方向的边角区块长度
        // 处理x →
        if(side_offset_z > 0){
            var x_start  = start_x;                 // 当前处理区域的起始区块坐标x
            var z_start  = start_z + z_amount * 10; // 当前处理区域的起始区块坐标z
            var x_left   = x_offset;                // 待处理的x方向长度
            var x_max    = Math.floor(100 / side_offset_z) - 1;     // 一次推进的最大长度
            while(true){
                if(x_left <= 0){
                    break;
                }
                else{
                    if(x_left >= x_max){
                        area_process_list.push([x_start, z_start, x_start + x_max, end_z, dim_id]);
                        x_start += x_max;
                        x_left  -= x_max;
                    }
                    else{
                        area_process_list.push([x_start, z_start, x_start + x_left, end_z, dim_id]);
                        x_start += x_left;
                        x_left  -= x_left;
                    }
                }
            }
        }
        // 处理z →
        var side_offset_x = x_offset - x_amount * 10; // x方向的边角区块长度
        if(side_offset_x > 0){
            var x_start  = start_x + x_amount * 10; // 当前处理区域的起始区块坐标x
            var z_start  = start_z;                 // 当前处理区域的起始区块坐标z
            var z_left   = z_amount * 10;           // 待处理的z方向长度
            var z_max    = Math.floor(100 / side_offset_x) - 1;     // 一次推进的最大长度
            while(true){
                if(z_left <= 0){
                    break;
                }
                else{
                    if(z_left >= z_max){
                        area_process_list.push([x_start, z_start, end_x, z_start + z_max, dim_id]);
                        z_start += z_max;
                        z_left  -= z_max;
                    }
                    else{
                        area_process_list.push([x_start, z_start, end_x, z_start + z_left, dim_id]);
                        z_start += z_left;
                        z_left  -= z_left;
                    }
                }
            }
        }
        return area_process_list;
    }
}
// 注: 在1.1版本, chunk的接口被取消了, 使用 Area 替代之
var processArray = [];
Chunk = {
    // [区块]
    // 获得 chunkX, chunkZ, dimid 区块的json对象, 在区块组中的位置设为chunksX, chunksZ
    get:function(chunkX, chunkZ, dim_id, chunksX, chunksZ, mode){
        // 计算区块的始末世界坐标
        var start_x = chunkX * 16;
        var start_z = chunkZ * 16;
        var end_x   = start_x + 15;
        var end_z   = start_z + 15;
        logger.info(`get chunk ${chunkX}, ${chunkZ}`);
        // 获取区块json对象
        var chunk = {
            "position" : [chunksX, chunksZ],
            "structure": Structure.get(start_x, -64, start_z, end_x, 320, end_z, dim_id, mode)
        };
        return chunk;
    },
    // 将位置为 chunkX, chunkZ, dimid 的区块设置为区块Json对象 chunk 所存储的
    set:function(chunkX, chunkZ, dim_id, chunk, entity){
        // 16 * 384 * 16 : x - y - z
        // 计算区块的起始坐标
        var start_x = chunkX * 16;
        var start_z = chunkZ * 16;
        Structure.set(start_x, -64, start_z, dim_id, chunk, entity);
        logger.info(`set chunk ${chunkX}, ${chunkZ}`)
    },
    clear:function(chunkX, chunkZ, dim_id, clearEntity){
        // 计算区块的始末世界坐标
        var start_x = chunkX * 16;
        var start_z = chunkZ * 16;
        var end_x   = start_x + 15;
        var end_z   = start_z + 15;
        logger.info(`clear chunk ${chunkX}, ${chunkZ}`);
        // 清除
        Structure.clear(start_x, -64, start_z, end_x, 320, end_z, dim_id, clearEntity);
    },
    // [区块组] 
    //  由多个区块组成的集合, 这些区块可以不相邻
    //  获得操作数组中的区块Json对象, 相对位置以startX, startZ为基准进行计算(无视维度)
    //  操作数组结构: [[x,z,dim],[x,z,dim]...], 坐标为绝对位置
    getGroup:function(startX, startZ, processArray){
        var chunks = [];
        for(var process of processArray){
            chunks.push(Chunk.get(process[0], process[1], process[2], 
                process[0] - startX, process[1] - startZ));
        }
        return chunks;
    },
    // 将区块文件 chunks 存储的区块, 以 chunkX, chunkZ 区块为起点进行加载
    setGroup:function(chunkX, chunkZ, dimid, chunks, entity, zFilter){
        for(var chunk of chunks){
            // 若不等于过滤器z则跳过
            if(zFilter != null && chunkZ + chunk["position"][1] != zFilter) continue;
            Chunk.set(chunkX + chunk["position"][0], chunkZ + chunk["position"][1], dimid, chunk["structure"], entity);
        }
    },
    //// 文件 ////
    // 保存区块组到文件 path/fileName 中
    saveGroup:function(chunks, fileName){
        // file.writeTo(fileName, JSON.stringify(defaultPlayerData, null , '\t'));
        file.writeTo(PLUGIN_PATH + fileName, JSON.stringify(chunks, null , '\t'));
    },
    // 读取区块文件 path/fileName, 文件不存在则返回空
    loadGroup:function(fileName){
        if(!file_exists(fileName)) return null; // 文件不存在则返回空
        return JSON.parse(file.readFrom(PLUGIN_PATH + fileName));
    },
    ///// 其它 /////
    // 判断区块是否为空
    is_empty:function(chunkX, chunkZ, dim_id){
        var start_x = chunkX * 16;
        var start_z = chunkZ * 16;
        return Structure.is_empty(start_x, -64, start_z, start_x + 15, 320, start_z + 15, dim_id);
    },
    // 确定世界坐标对应的区块坐标,返回{x:xx, z:z}
    transferWorldPoint(x, z){
        return {"x" : Math.floor(x/16), "z" : Math.floor(z/16)};
    }

}
Structure = {
    ///// 基础 /////
    // 获取一片区域, mode = 0:不保存实体; 1:保存3D区域内的实体; 2: 保存2D区域内的实体(用于保存区块)
    get:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, mode){
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
        logger.info(`get structure: ${dim_id}, ${start_x}, ${start_y}, ${start_z}, ${end_x}, ${end_y}, ${end_z}, mode ${mode}.`);
        // 因为始末都要算, 长度+1
        var x_offset = end_x - start_x + 1;
        var y_offset = end_y - start_y + 1;
        var z_offset = end_z - start_z + 1;
        // 初始化结构json对象
        var structure = {
            "size"    :[x_offset, y_offset, z_offset],
            "blocks"  :[],
            "entities":[]
        };

        // 对于区域 start_x, start_y, start_z ~ end_x, end_y, end_z
        ///// 保存实体信息 /////
        if(mode != 0){
            logger.info("en");
            var entities = mc.getAllEntities();
            for(var entity of entities){
                logger.info(entity.type);
                logger.info(entity.isPlayer());
                logger.info(entity.pos.dimid);
                if(!entity.isPlayer() && entity.pos.dimid == dim_id 
                    && (  (mode == 1 && pointInArea_3D(entity.pos.x, entity.pos.y, entity.pos.z, start_x, start_y, start_z, end_x, end_y, end_z))
                       || (mode == 2 && pointInArea_2D(entity.pos.x, entity.pos.z, start_x, start_z, end_x, end_z))
                       )
                    ){
                    var entityJson = {
                        "type":entity.type,
                        "position":[
                            entity.pos.x - start_x,
                            entity.pos.y - start_y,
                            entity.pos.z - start_z
                        ],
                        "NBT":entity.getNbt().toSNBT()
                    }
                    structure["entities"].push(entityJson);
                }
            }
        }
        ///// 保存方块信息 /////
        var y = start_y;
        var blockI = -1;
        for(var iy = 0; iy < y_offset; iy++){
            var x = start_x;
            for(var ix = 0; ix < x_offset; ix++){
                var z = start_z;
                for(var iz = 0; iz < z_offset; iz++){
                    // logger.info(`${x},${y},${z},${dim_id}`)
                    var blockJson  = {};
                    var bl         = mc.getBlock(x, y, z, dim_id);
                    // NBT
                    blockJson["NBT"] = bl.getNbt().toSNBT();
                    // 容器和方块实体
                    var hasFeature = false;
                    if(bl.hasContainer()){
                        var items = bl.getContainer().getAllItems(); // Array<Item,Item,...>
                        var container = [];
                        for(var itemI = 0; itemI<items.length; itemI++){
                            container[itemI] = items[itemI].getNbt().toSNBT();
                        }
                        blockJson["container"] = container;
                        delete container;
                        hasFeature = true;
                    }
                    if(bl.hasBlockEntity()){
                        // 自然生成的蜂巢无法获取方块实体
                        if(bl.type != "minecraft:bee_nest"){
                            blockJson["entity"] = bl.getBlockEntity().getNbt().toSNBT();
                            hasFeature = true;
                        }                    
                    }
                    // 存储
                    if(blockI != -1 && !hasFeature && blockJson["NBT"] == structure["blocks"][blockI]["NBT"]){
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
        return structure;
    },
    set:function(start_x, start_y, start_z, dim_id, structure, entity = true){
        ///// 加载方块 /////
        var y = start_y;
        var blocks = structure["blocks"];
        var blockI = 0;
        var finish = 0;
        for(var iy = 0; iy < structure["size"][1]; iy++){
            var x = start_x;
            for(var ix = 0; ix < structure["size"][0]; ix++){
                var z = start_z;
                for(var iz = 0; iz < structure["size"][2]; iz++){
                    // 放置
                    mc.setBlock(x, y, z, dim_id, NBT.parseSNBT(blocks[blockI]["NBT"]));
                    // 容器
                    if(blocks[blockI]["container"] != null){
                        var ct = mc.getBlock(x, y, z, dim_id).getContainer();
                        var items = blocks[blockI]["container"];
                        for(var itemI = 0; itemI < items.length; itemI++){
                            ct.setItem(itemI, mc.newItem(NBT.parseSNBT(items[itemI])));
                        }
                    }
                    // 方块实体
                    if(blocks[blockI]["entity"] != null){
                        mc.getBlock(x, y, z, dim_id).getBlockEntity().setNbt(NBT.parseSNBT(blocks[blockI]["entity"]));
                    }
                    finish ++;
                    // 下一步
                    if(finish >= blocks[blockI]["amount"]){
                        blockI ++;
                        finish = 0;
                    }
    
                    z++;
                }
                x++;
            }
            y++;
        }
        ///// 加载实体 /////
        if(entity){
            for(var entityJson of structure["entities"]){
                // logger.info(entityJson["type"]);
                if(entityJson["type"] == "minecraft:item"){
                    // 物品 暂时忽略
                }
                else if(entityJson["type"] == "minecraft:xp_orb"){
                    // 经验球 暂时忽略
                }
                else{
                    var entityX = start_x + entityJson["position"][0];
                    var entityY = start_y + entityJson["position"][1];
                    var entityZ = start_z + entityJson["position"][2];
                    var entity = mc.spawnMob(entityJson["type"], entityX, entityY, entityZ, dim_id);
                    // 设置NBT
                    entity.setNbt(NBT.parseSNBT(entityJson["NBT"]));
                    // 由于NBT会改变坐标, 需要恢复位置, 而NBT中的坐标 Pos\":[7.78197f, 59.6703f, 11.6216f] 没有修改接口, 所以需要传送
                    entity.teleport(entityX, entityY, entityZ, dim_id);
        
                }
            }
        }
        logger.info(`set structure: ${start_x}, ${start_y}, ${start_z}, ${dim_id}`);
    },
    // 保存文件到结构中
    save:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, mode, file_name){
        file.writeTo(this.getPath(file_name), 
          JSON.stringify(this.get(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, mode), null , '\t'));
    },
    // 从文件中读取结构
    load:function(file_name){
        var path = this.getPath(file_name);
        if(!file.exists(path)) return null; // 文件不存在则返回空
        return JSON.parse(file.readFrom(path));
    },
    getPath:function(fileName){
        return PLUGIN_PATH + "structures/" + fileName + ".json";
    },
    clear:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id, clearEntity){
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
        logger.info(`clear structure: ${dim_id}, ${start_x}, ${start_y}, ${start_z}, ${end_x}, ${end_y}, ${end_z}`);

        // 对于区域 start_x, start_y, start_z ~ end_x, end_y, end_z
        ///// 删除实体 /////
        if(clearEntity){
            var entities = mc.getAllEntities();
            for(var entity of entities){
                if(!entity.isPlayer() && entity.pos.dimid == dim_id 
                    && (  (mode == 1 && pointInArea_3D(entity.pos.x, entity.pos.y, entity.pos.z, start_x, start_y, start_z, end_x, end_y, end_z))
                       || (mode == 2 && pointInArea_2D(entity.pos.x, entity.pos.z, start_x, start_z, end_x, end_z))
                       )
                    )
                {
                    entity.kill();
                }
            }
        }
        ///// 删除方块 /////
        for(var iy = 0; iy < y_offset; iy++){
            var x = start_x;
            for(var ix = 0; ix < x_offset; ix++){
                var z = start_z;
                for(var iz = 0; iz < z_offset; iz++){
                    mc.setBlock(x, y, z, dim_id, "minecraft:air");
                    z++;
                }
                x++;
            }
            y++;
        }
    },
    // 旋转 未完成
    rotate:function(structure){

    },
    // 镜像 未完成
    mirror:function(structure, axis){
        var newStructure = {
            "size"    :[structure["size"][0], structure["size"][1], structure["size"][2]],
            "blocks"  :[],
            "entities":[]};
        
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
    },
    ///// 批量 /////
    createSaveStructureTask:function(s_x, s_y, s_z, e_x, e_y, e_z, dim_id){

    }
}
// ============== Schedule =========================
// ============== Tools ============================
function file_exists(fileName){
    return file.exists(`${PLUGIN_PATH}${fileName}`);
}
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
    logger.info(x + " " + y + " "+ z + " "+ areaStart_x + " " + areaStart_y + " " + areaStart_z + " " + areaEnd_x + " " + areaEnd_y + " "+ areaEnd_z);
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
    logger.info("true");
    return true;

}
// 在下界和末地执行指令
var cmdNumber = 0;
function runCmd(dim_id, cmd){
    if(dim_id == 0){
        mc.runcmd(cmd);
        return;
    }
    var cNumber = cmdNumber ++;
    var tempBlock = Structure.get(0, 0, 0, 0, 1, 0, dim_id, 0);
    
    mc.setBlock(0,0,0,0,"minecraft:bedrock")
    var tempPig = mc.spawnMob("minecraft:pig", 0, 1, 0, dim_id);
    tempPig.addTag("wb_cmd" + cNumber);
    mc.runcmd(`execute @e[tag=wb_cmd${cNumber}] ~~~ ${cmd}`);
    setTimeout(() => { tempPig.kill(); }, 100);

    Structure.set(0, 0, 0, 0, tempBlock, false);
}

load();