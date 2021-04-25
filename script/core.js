// 定数の定義
const KEY_ABILITY = ["body", "skill", "emotion", "divine", "society", "combat", "shoot", "dodge", "action"];
const ABILITIES = {"body": "肉体", "skill": "技術", "emotion": "感情", "divine": "加護", "society": "社会", "combat": "白兵", "shoot": "射撃", "dodge": "回避", "action": "行動"};
var reserved_data = false;

// 名称定義から【能力値】の名前をreturnする関数
function convert_ability_name(mode, ability) {
    var a = (mode == "beast" ? "魔" : "") + ABILITIES[ability];
    return a.substr(0, 2);
}

// 名称定義から【基本能力値】か【戦闘能力値】かをreturnする関数
function ability_type(name) {
    if(["combat", "shoot", "dodge", "action"].includes(name)) { return "battle"; }
    if(["body", "skill", "emotion", "divine", "society"].includes(name)) { return "base"; }
    return false;
}

// 文字列の加工：一部の全角文字を半角文字に変換
function str_changeEmToEn(str) {
    if(!str) { return ""; }
    var str3 = str.replace(/[Ａ-Ｚａ-ｚ０-９＋－（）]/g, function(s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); } );
	return str3;
}

// 文字列の加工：空白文字の削除
function str_delete_empty(str) {
    if(!str) { return ""; }
    return str.replace(/(\r?\n|\s+)/g, '');		// 改行文字、空白を削除
}

// 文字列の加工：改行の削除
function str_delete_fl(str) {
    if(!str) { return ""; }
    return str.replace(/\r?\n/g, '');		// 改行文字を削除
}

function formatDamageRolls(str) {
    if(!str) { return ""; }
    return str_changeEmToEn(str_delete_empty(str_delete_fl(str)));
}

// 配列などが空であるかを確認
function isEmpty(obj) {
	return !Object.keys(obj).length;
}

// 各種能力値の文字を切り分ける
function getAblSeparated(str, def = 0) {
    if(!str) { return [def]; }
    let result = str.match(/[\-\d]+/g);
    console.log(result, def);
    return result ? result : [def];
}

// 【基本能力値】【戦闘能力値】のチェック
function getAblParams(data) {
    var result = {};
    for(var i of ["body", "skill", "emotion", "divine", "society"]) { result[i] = data.baseAbility[i].total.match(/[\-\d]+/g); }
    for(var j of ["combat", "shoot", "dodge", "action"]) { result[j] = data.battleAbility[j].total.match(/[\-\d]+/g); }
    return result;
}

// 判定修正値の取得 key:能力値のキー、mode:"human"人間 か "beast" 魔獣化中か
function calc_modification(key, mode) {
    var i = 0;
    var mods = document.output_judge_bonus;
    var array = [
        mods[`all_auto`].value,
        mods[`all_${mode}`].value,
        mods[`${ability_type(key)}_auto`].value,
        mods[`${ability_type(key)}_${mode}`].value,
        mods[`${key}_auto`].value,
        mods[`${key}_${mode}`].value
    ];
    for(var j of array) {
        if(!j) { continue; }
        if(j.match(/^[+-]\d+/)) { i += j - 0; }
    }
    console.log("mod", i);
    return i;
}

// ファンブル値の計算 key:能力値のキー、mode:"human"人間 か "beast" 魔獣化中か
function calc_fumble_fix(key, mode) {
    let i = 0;
    let a = "";
    var mods = document.fumble_fix;
    // 《ダメ魔物》：魔獣化中のすべての判定にファンブル値+2
    if(mods.badbeast.checked && mode === "beast") { i += 2; }
    // 《しまった、こんな時に！》：ダメじゃないモードでファンブルしても達成値0にならない
    if(mods.ohno.checked) {
        if(mods.badbeast.checked && mode === "human") {
            a = "A";
        } else if(!mods.badbeast.checked && mode === "beast") {
            a = "A";
        }
    }
    // 《偉大なる血脈》：すべてのファンブル値+1
    if(mods.greatold.checked) { i += 1; }
    // 《この世ならざるもの》：ファンブルしても達成値が0にならない
    if(mods.unworldly.checked) { a = "A"; }
    // 《不思議科学》：すべてのファンブル値+1
    if(mods.sciencefantasy.checked) { i += 1; }
    // 《身体改造処置》：【基本能力値】判定のファンブル値+1
    if(mods.bodyrebuild.checked && ability_type(key) === "base") { i += 1; }
    // 《精神強化処置》：【戦闘能力値】判定のファンブル値+1
    if(mods.mindrebuild.checked && ability_type(key) === "battle") { i += 1; }
    // 《不安定なる高性能》：魔獣化中のすべてのファンブル値+1
    if(mods.unstablehigh.checked && mode === "beast") { i += 1; }
    // 《契約代償：不運》：すべてのファンブル値+2
    if(mods.return_unluck.checked) { i += 2; }
    // 《秘されし真名》：《魔獣化》中のファンブル値+1
    if(mods.secretname.checked && mode === "beast") { i += 1; }

    let result;
    if(a) {
        result = "A+" + i;
    } else {
        result = i > 0 ? ("+" + i) : void 0;
    }
    return result;
}

// 状態に合わせた能力値の取得 obj:一覧、ability:能力値のキー、mode:human/beast
function get_ability_value(obj, ability, mode) {
    var score = obj[ability];
    var a = mode == "beast" ? score.length-1 : 0;
    return score[a];
}

// 判定文の作成　obj:能力値の一覧、mode:human/beast、ability: 能力値のキー、system:使用するオンセツールの情報
function making_judge_text(obj, mode, ability, system) {
    // 能力値の数値取得
    let abl = get_ability_value(obj, ability, mode);
    let text = system.prefix_str + "2BB";
    // 修正値
    let mod = calc_modification(ability, mode);
    if(mod != 0) { text += mod > 0 ? `+${mod}` : mod; }
    // 能力値名を書くか、数値を平書きするか
    if(system.reserved) {
        let abl_name = obj[ability].length == 1 ? ABILITIES[ability] : convert_ability_name(mode, ability);
        text += `+{${abl_name}}`;
    } else {
        text += `+${abl}`;
    }
    // 人間性とクリティカル値の表記。予約語にも引用にも対応しない場合、変更できることを強調する意味で@12と記載
    if(system.mutation && system.reserved) {
        text += "@-{変異段階}";
    } else if(system.reserved && system.citation) {
        text += "%{人間性}";
    } else {
        text += "@12";
    }
    // ファンブル値の表記
    let f = calc_fumble_fix(ability, mode);
    if(f) { text += `#${f}`; }
    // 何の判定か
    text += ` 【${ABILITIES[ability]}】判定`;
    console.log(mode, ability, text);
    return text;
}

// 判定文の作成：統括
function create_JudgeStr(obj, system = {prefix_str: "", ability: false, reserved: false, mutation: false, citation: true}) {
    let result = {};
    let ability_text = ["◆能力値 -----"];
    let text_pool = [];
    let text_pool_beast = [];

    for(var i of KEY_ABILITY) {
        // 人間形態
        let text_human = making_judge_text(obj, "human", i, system);
        // 魔獣形態
        let text_beast = making_judge_text(obj, "beast", i, system);
        // 判定文をpush（魔獣化中の分は、人間形態と異なる場合のみpush）
        text_pool.push(text_human);
        if(text_beast !== text_human) {
            if(document.output_basic.sort_roll.value == "能力値別") {
                text_pool.push(text_beast + "（魔獣化中）");
            } else {
                text_pool_beast.push(text_beast + "（魔獣化中）");
            }
        }
        // 能力値文をpush（system.ability == trueの場合のみ）
        if(system.ability) {
            let abl = obj[i];
            ability_text.push(`//${ABILITIES[i]}=${abl[0]}`);
            if(abl.length > 1) { ability_text.push(`//${convert_ability_name("beast", i)}=${abl[1]}`); }
        }
    }
    let judge_text = ["◆主な判定一覧 -----"].concat(text_pool, text_pool_beast);
    result.judge = judge_text.join("\n");
    result.ability = ability_text.length > 1 ? ability_text.join("\n") : void 0;
    return result;
}

// 一般的な行動
function create_generalaction_Str(data) {
    if(!document.output_basic.include_basic.checked) { return false; }
    let general_text = ["◆一般的な行動 -----", "ムーブ - 通常移動", "メジャー - 離脱移動"];
    for(let i of data.weapons) {
        if(!i) { continue; }
        if(!i.attack || !i.name) { continue; }
        general_text.push(`メジャー - 「${str_delete_fl(i.name)}」で攻撃`);
    }
    return general_text.join("\n");
}

// アーツデータ
function create_arts_Str(data) {
    if(!document.output_basic.include_arts.checked) { return false; }
    let arts_text = ["◆アーツ一覧 -----"];
    console.log(arts_text);
    let option = document.output_arts_items;
    for(let i of data.arts) {
        let str = "";
        console.log(i);
        if(!check_output_arts_items(i)) { continue; }
        str += str_delete_fl(`${i.timing} - 《${i.name}》`);
        if(option.arts_cost.checked && i.cost) { str += `（コスト：${i.cost}）`; }
        if(option.effect.checked && i.notes) { str += str_delete_fl(`：${i.notes}`); }
        arts_text.push(str);
    }
    return arts_text.join("\n");
}

// アイテムデータ
function create_items_Str(data) {
    if(!document.output_basic.include_items.checked) { return false; }
    let items_text = ["◆アイテム一覧 -----"];
    console.log(items_text);
    let option = document.output_arts_items;
    for(let i of data.items) {
        let str = "";
        console.log(i);
        if(!check_output_arts_items(i)) { continue; }
        str += str_delete_fl(`${i.timing} - 「${i.name}」`);
        console.log("タイミング・名前での不具合なし");
        if(option.effect.checked && i.notes) { str += str_delete_fl(`：${i.notes}`); }
        console.log("完走");
        items_text.push(str);
    }
    return items_text.join("\n");
}


// 出力許可
function check_output_arts_items(obj) {
    let option = document.output_arts_items;
    // 空データの場合、出力しない
    if(!obj) { return false; }
    // データの「名前」が空欄の場合、出力しない
    if(!obj.name) { return false; }
    // 「タイミング」が空欄の場合のオプション処理
    if(!obj.timing) {
        if(!option.timing_empty.checked) { return false; }
    }
    // 「タイミング：常時」の場合のオプション処理
    if(obj.timing === "常時") {
        if(!option.timing_passive.checked) { return false; }
    }
    return true;
}

// ダメージロールデータ
function create_damagerolls_Str(data) {
    if(!document.output_basic.include_weapon.checked) { return false; }
    let damage_text = ["◆ダメージロール一覧 -----"];
    for(let i of data.weapons) {
        let str = [];
        if(!i) { continue; }
        if(!i.name || !i.attack) { continue; }
        let rollstr = separateAttackFormula(formatDamageRolls(i.attack));
        console.log(rollstr);
        if(rollstr.human) {
            let roll_human = prefix_damagerolls(rollstr.human, "human", i.attribute, data, i);
            str.push(roll_human);
        }
        if(rollstr.beast) {
            let roll_beast = prefix_damagerolls(rollstr.beast, "beast", i.attribute, data, i);
            str.push(roll_beast);
        } else if(get_param_from_attribute(data, i.attribute).length > 1 && (rollstr.human.startsWith("+") || rollstr.human.startsWith(i.attribute))) {
            let roll_beast = prefix_damagerolls(rollstr.human, "beast", i.attribute, data, i);
            if(str[0] !== roll_beast) { str.push(roll_beast); }
        }
        damage_text.push(str.join("\n"));
    }
    if(document.output_damage_rolls.arts_note.checked) {
        for(let j of data.arts) {
            let str = [];
            if(!j) { continue; }
            if(!j.name || !j.notes) { continue; }
            // [ ]の検索
            let arts_matched = /\[(.*)\]/.exec(formatDamageRolls(j.notes));
            if(!arts_matched) { continue; }
            // 属性 < > または 〈 〉の検索
            let attribute_matched = /(?:<|〈)(肉体|技術|感情|加護|社会)(?:>|〉)/.exec(formatDamageRolls(j.notes));
            let rollstr = separateAttackFormula(arts_matched[1]);
            let atri = attribute_matched ? attribute_matched[1] : void 0;
            console.log("arts_damageroll", rollstr);
            if(rollstr.human) {
                let roll_human = prefix_damagerolls(rollstr.human, "human", atri, data, j);
                str.push(roll_human);
            }
            if(rollstr.beast) {
                let roll_beast = prefix_damagerolls(rollstr.beast, "beast", atri, data, j);
                str.push(roll_beast);
            } else {
                if(atri) {
                    if(get_param_from_attribute(data, atri).length > 1 && (rollstr.human.startsWith("+") || rollstr.human.startsWith(atri))) {
                        let roll_beast = prefix_damagerolls(rollstr.human, "beast", i.attribute, data, j);
                        if(str[0] !== roll_beast) { str.push(roll_beast); }
                    }
                }
            }
            damage_text.push(str.join("\n"));
        }
    }
    return damage_text.join("\n");
}

// 属性名からその能力値を取得する
function get_param_from_attribute(data, attribute) {
    let ability = Object.keys(ABILITIES).filter( (key) => { return ABILITIES[key] === attribute; });
    return getAblParams(data)[ability];
}

// ダメージロール式の処理
// str: ダメージロールの元文字列 , mode: human/beast , attribute: 属性 ,
// data: キャラクターシートのデータ , obj: 武器/アーツ
function prefix_damagerolls(str, mode, attribute, data, obj) {
    let using_tool = setup_basic(document.sheet_info.using_tool.value);
    let score = getAblParams(data);
    let ability = void 0;
    if(attribute) { ability = Object.keys(ABILITIES).filter( (key) => { return ABILITIES[key] === attribute; }); }
    let result = using_tool.prefix_str;
    // prefix : 属性データがない場合はテキストをそのまま書き下す。ある場合でstrが属性名か+で始まるなら能力値を代入
    if(ability) {
        if(str.startsWith("+")) {
            result += get_ability_value(score, ability, mode) + str;
        } else if(str.startsWith(attribute)) {
            result += str.replace(attribute, `${get_ability_value(score, ability, mode)}`);
        } else {
            result += str;
        }
    } else {
        result += str;
    }
    console.log("prefix_damagerolls", str, mode, result);
    // suffix
    result += " " + str_delete_fl(obj.name);
    if(attribute) { result += `／〈${attribute}〉属性`; }
    if(mode === "beast") { result += "（魔獣化中）"; }
    if(document.output_damage_rolls.weapon_note.checked && obj.notes && !obj.cost) {
        result += "／" + str_delete_fl(obj.notes);
    }
    return result;
}

// 一般的なリアクション宣言
function create_general_reaction_Str(data) {
    if(!document.output_basic.include_react.checked) { return false; }
    let reaction_text = ["◆一般的なリアクション宣言 -----", "ドッジ"];
    for(let i of data.weapons) {
        if(!i || !i.name || !i.guard) { continue; }
        let str = [];
        let guard_text = separateAttackFormula(formatDamageRolls(i.guard));
        if(guard_text.human) {
            reaction_text.push(`「${str_delete_fl(i.name)}」でガード ／ ガード値：${guard_text.human}`);
        }
        if(guard_text.beast) {
            reaction_text.push(`「${str_delete_fl(i.name)}」でガード（魔獣化中） ／ ガード値：${guard_text.beast}）`);
        }
    }
    return reaction_text.join("\n");
}

function btn_click() {
    var msg = document.sheet_info.sheet_url.value;
    console.log(msg);
    var key = "http://character-sheets.appspot.com/bbt/display?ajax=1&key=" + msg.split(/key=/)[1];
    if(setup_PoneOutput(document.sheet_info.using_tool.value).image) {
        key += "&base64Image=1";
    }
	var jsc = document.createElement('script');
	jsc.src = key + "&callback=convert_process";
	document.body.appendChild(jsc);
	document.body.removeChild(document.body.lastChild);
}

function convert_process(data) {
    // データの取得
    if(isEmpty(data)) {
        window.alert('エラー：データが取得できませんでした。キャラクターシートのURLを再確認してください。');
        return;
    }
    console.log(data);
    // result準備
    let result = {};
    // オンラインセッション用ツールの確認
    let using_tool = setup_basic(document.sheet_info.using_tool.value);
    // 能力値データの取得
    let ability_scores = getAblParams(data);
    // 判定文データの作成
    result.judge = create_JudgeStr(ability_scores, using_tool);
    // 一般的な行動のデータ作成
    result.general = create_generalaction_Str(data);
    // アーツデータの作成
    result.arts = create_arts_Str(data);
    // アイテムデータの作成
    result.items = create_items_Str(data);
    // リアクションデータの作成
    result.reaction = create_general_reaction_Str(data);
    // ダメージロールの作成
    result.damage = create_damagerolls_Str(data);
    // console.log(result_judge_text);

    // 結果文の作成
    let texts = [];
    if(using_tool.reserved && using_tool.mutation) { texts.push("//変異段階=0", ""); }
    texts.push(using_tool.prefix_str+"1D6KH1 シーン登場時の人間性低下", using_tool.prefix_str+"2D6KH1 迫害状態中のシーン登場", "");
    if(result.judge.judge) { texts.push(result.judge.judge, ""); }
    if(result.general) { texts.push(result.general, ""); }
    if(result.arts) { texts.push(result.arts, ""); }
    if(result.items) { texts.push(result.items, ""); }
    if(result.reaction) { texts.push(result.reaction, ""); }
    if(result.damage) { texts.push(result.damage, ""); }
    if(result.judge.ability) { texts.push(result.judge.ability, ""); }
    document.result.text.value = texts.join("\n");
    document.result.style.display='block';

    // 駒変換器機能との連携確認
    if(document.output_pone.using.checked) {
        reserved_data = data;
        if(document.pone_converter.quick.checked) {
            pone_click();
        } else {
            pone_output_ready();
        }
    }
}

function pone_click() {
    let data = reserved_data;
    pone_converter_setup(data, document.sheet_info.using_tool.value);
}

function pone_output_ready() {
    document.converter_output.pone.disabled = reserved_data == false ? true : false;
}