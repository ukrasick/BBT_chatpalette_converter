// 定数：パスワードのベース文字列
PASS_LOWER = "0123456789abcdefghijklmnopqrstuvwxyz";
PASS_UPPER = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";


// コンバーターの処理発火点
function pone_converter_setup(data, tool) {
    switch(tool) {
        case "udonarium":
            udona_process(data, tool);
            break;
        case "ccfolia":
            ccfolia_process(data);
            break;
    }
}

// 処理テンプレート
function process_template(data, tool) {
    let system = setup_PoneOutput(tool);
    let result = {};
    if(system.image){
        // 画像データ関連の処理
    }
    if(system.status) {
        // ステータス関連の処理
    }
    if(system.ability) {
        // 能力値関連の処理
    }
    if(system.nexus) {
        // 絆・エゴデータ関連の処理
    }
    if(system.palette) {
        // チャットパレットデータに関する処理
    }
}

// 画像データ処理の共通部分
function core_process_images(data) {
    let hashImage, b64Image;
    if(data.images) {
        b64Image = data.images.uploadImage.replace(/^.*,/ , "");
        let shaObj = new jsSHA("SHA-256", "B64");
        shaObj.update(b64Image);
        hashImage = shaObj.getHash("HEX");
    }
    return {hashImage: hashImage, imagesrc: b64Image};
}

// ステータス取得の共通部分
function core_process_status(data, tool) {
    let system = setup_PoneOutput(tool);
    // 各種データの取得
    // 【FP】
    let fp = getAblSeparated(data.fp.total);
    // 人間性
    let humanity = getAblSeparated(data.humanity.total, 60);
    // 各種【基本能力値】【戦闘能力値】
    let ability_scores = getAblParams(data);
    // 愛の初期値（大罪取得者は3、それ以外は4）
    let agape = (system.greatsin && document.pone_converter.greatsin.checked) ? 3 : 4;
    // 財産点の初期値
    let credit = get_ability_value(ability_scores, "society", "human");
    // 初期財産点の調整
    if(system.initialcredit && document.pone_converter.initialcredit.checked) {
        let ic = document.pone_converter.ic_number.value.match(/\d+/);
        if(ic) { credit = ic[0]; }
    }
    return {"fp": fp, "humanity": humanity, "agape": agape, "credit": credit};
}

// 絆・エゴ情報取得の共通部分
function core_process_nexus(data, tool) {
    let system = setup_PoneOutput(tool);
    let nexus = [
        ["絆", "〔出自絆〕"],
        ["絆", "〔邂逅絆〕"],
        ["エゴ", "〔初期エゴ〕"],
        ["絆", "〔シナリオ絆〕"],
        ["絆", "〔PC間絆〕"],
        ["絆", "〔自由枠の絆〕"],
        ["絆", "〔自由枠の絆〕"]
    ];
    if(!system.nexus || !document.pone_converter.nexus.checked) { return nexus; }
    let binds = data.binds;
    for(let i = 0; i < 7; i++) {
        if(!binds[i]) { continue; }
        if(binds[i].type && binds[i].name) {
            nexus[i] = [binds[i].type, binds[i].name];
            if(binds[i].relation) { nexus[i][1] += `（関係：${binds[i].relation}）`; }
        }
    }
    return nexus;
}

// ユドナリウムデータ処理
function udona_process(data, tool) {
    let system = setup_PoneOutput(tool);
    let result = {};
    if(system.image){
        result.image = udona_images(data);
    }
    if(system.status) {
        result.status = udona_status(data);
    }
    if(system.ability) {
        result.ability = udona_ability(data);
    }
    if(system.nexus) {
        result.nexus = udona_nexus(data);
    }
    if(system.palette) {
        result.palette = document.pone_converter.palette.checked ? udona_palette() : {src: ""};
    }
    // バフパレットは別途処理
    if(document.pone_converter.buffpalette.checked) {
        result.buffpalette = udona_buffpalette();
    } else {
        result.buffpalette = {src: ""};
    }

    console.log(result);

    // キャラクター情報の定義開始
    let xmls = [
        '<character location.name="table" location.x="300" location.y="300" posZ="0" rotate="0" roll="0">',
        '<data name="character">',
        ''
    ];
    // 画像関係のデータ
    if(result.image.src) { xmls.push(result.image.src, ''); }
    // キャラクター基本情報
    let pc_profile = [
        '<data name="common">',
            tabstr(1) + '<data name="name">' + avoid_inequality(data.base.name) + '</data>',
            tabstr(1) + '<data name="size">1</data>',
        '</data>'
    ];
    xmls.push(pc_profile.join("\n"), "");
    // ここから詳細情報
    xmls.push('<data name="detail">', '');
        // 基本ステータス情報
        if(result.status.src) { xmls.push(result.status.src, ''); }
        // 能力値等の情報
        if(result.ability.src) { xmls.push(result.ability.src, ''); }
        // 絆・エゴデータ（チェックが入っている場合のみ、データの出力を行う）
        if(document.pone_converter.nexus.checked) {
            if(result.nexus.src) { xmls.push(result.nexus.src, ''); }
        }
    // 詳細情報ここまで
    xmls.push('</data>', '');
    // 最初の<data name="character">を閉じる
    xmls.push('</data>', '');
    // チャットパレットデータ
    if(result.palette.src) { xmls.push(result.palette.src, ''); }
    // バフパレットデータ
    if(result.buffpalette.src) { xmls.push(result.buffpalette.src, ''); }
    // キャラクター情報の定義終了
    xmls.push('</character>');

    // xmlファイルの作成
    let output = { xml:[], img:[] };
    let blobXML = new Blob([xmls.join("\n")], {type: 'text/xml'});
    if(blobXML) {
        output.xml = [blobXML];
    }
    if(result.image.hashImage) {
        output.img = [result.image.imagesrc, result.image.hashImage];
    }

    // zipファイルの作成とダウンロード
    let zip = new JSZip();
    zip.file(`${data.base.name}.xml`, output.xml[0]);
    if(output.img.length > 0) {
        zip.file(`${output.img[1]}.png`, output.img[0], {base64: true});
    }
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, `${data.base.name}.zip`);
    });
}

// ユドナリウム：画像データ処理
function udona_images(data) {
    // データの読み込み
    let result = core_process_images(data);
    // テキストの作成
    let src = [
        '<data name="image">',
            tabstr(1) + '<data type="image" name="imageIdentifier">' + (result.hashImage ? result.hashImage : "none_icon" ) + '</data>',
        '</data>'
    ];
    result.src = src.join("\n");
    // 結果の出力
    return result;
}

// ユドナリウム：ステータス処理
function udona_status(data) {
    let result = {};
    // 各種データの取得
    // return {"fp": fp, "humanity": humanity, "agape": agape, "credit": credit};
    let status = core_process_status(data, "udonarium");
    // データの作成
    let src = [
        '<data name="基本ステータス">',
            tabstr(1) + `<data type="numberResource" currentValue="${status.fp[0]}" name="FP">${status.fp[0]}</data>`,
            tabstr(1) + `<data name="人間性">${status.humanity[0]}</data>`,
            tabstr(1) + `<data name="愛">${status.agape}</data>`,
            tabstr(1) + `<data name="罪">0</data>`,
            tabstr(1) + `<data name="財産点">${status.credit}</data>`
    ];
    if(check_CursedOne(data)) {
        src.push(tabstr(1) + `<data name="反動">0</data>`);
    }
    src.push('</data>');
    // 結果の出力
    result.src = src.join("\n");
    return result;
}

// ユドナリウム：能力値関連の処理
function udona_ability(data) {
    let result = {};
    let human = ['<data name="能力値">'];
    let beast = ['<data name="能力値（魔獣化中）">'];
    let ability_scores = getAblParams(data);
    for(let i of KEY_ABILITY) {
        human.push(tabstr(1) + `<data name="${convert_ability_name('human', i)}">${get_ability_value(ability_scores, i, 'human')}</data>`);
        beast.push(tabstr(1) + `<data name="${convert_ability_name('beast', i)}">${get_ability_value(ability_scores, i, 'beast')}</data>`);
    }
    human.push('</data>');
    beast.push('</data>');
    // 結果の出力
    result.src = human.join("\n") + "\n" + beast.join("\n");
    return result;
}

// ユドナリウム：絆・エゴ情報の処理
function udona_nexus(data) {
    let result = {};
    let src = ['<data name="絆・エゴ">'];
    // 絆・エゴデータの取得
    let nexus = core_process_nexus(data, "udonarium");
    // ループ開始
    for(let i of nexus) {
        let str = tabstr(1) + `<data name="${avoid_inequality(i[0])}" type="note">${avoid_inequality(i[1])}</data>`;
        src.push(str);
    }
    src.push('</data>');
    // 結果の出力
    result.src = src.join("\n");
    return result;
}

// ユドナリウム：チャットパレット
function udona_palette() {
    let result = {};
    let src = '<chat-palette dicebot="BeastBindTrinity">' + avoid_inequality(document.result.text.value) + '</chat-palette>';
    result.src = src;
    return result;
}

// ユドナリリィ：バフパレット
function udona_buffpalette() {
    let result = {};
    let src = '<buff-palette dicebot="BeastBindTrinity">' + avoid_inequality(document.pone_converter.buffpalette_content.value) + '</buff-palette>';
    result.src = src;
    return result;
}

// ココフォリア：ステータス（イニシアティブ表的に掲載されるデータ）
function ccfolia_status(data) {
    // 各種データの取得
    // return {"fp": fp<配列[0]>, "humanity": humanity<配列[0]>, "agape": agape, "credit": credit};
    let status = core_process_status(data, "ccfolia");
    let result = [
        {max: status.fp[0], value: status.fp[0], label: "FP"},
        {max: status.humanity[0], value: status.humanity[0], label: "人間性"},
        {max: 6, value: status.agape, label: "愛"},
        {max: 7, value: 0, label: "罪"},
        {max: status.credit, value: status.credit, label: "財産点"}
    ];
    if(check_CursedOne(data)) {
        result.push({max: 0, value: 0, label: "反動"});
    }
    return result;
}

// ココフォリア：パラメータ（駒内に保持される定数データ）
function ccfolia_params(data) {
    // 各種データの取得
    let ability_scores = getAblParams(data);
    let human = [];
    let beast = [];
    for(let i of KEY_ABILITY) {
        human.push({label: convert_ability_name("human", i), value: get_ability_value(ability_scores, i, "human")});
        beast.push({label: convert_ability_name("beast", i), value: get_ability_value(ability_scores, i, "beast")});
    }
    return human.concat(beast);
}

// ココフォリア：絆・エゴデータ（メモ欄に押し込む）
function ccfolia_nexus(data) {
    if(!document.pone_converter.nexus.checked) { return ""; }
    let result = [];
    let nexus = core_process_nexus(data, "ccfolia");
    result = ["【SA】与えられたら記入", "---------------"];
    for(let i of nexus) { result.push(`【${i[0]}】${i[1]}`, i[0] == "エゴ" ? "" : "　＞【エゴ化】", "-----"); }
    return result.join('\n');
}

// ココフォリア：チャットパレット
function ccfolia_palette() {
    return document.pone_converter.palette.checked ? avoid_inequality(document.result.text.value) : "";
}

// ココフォリア：駒データ出力
function ccfolia_process(data) {
    // 画像データのセットアップ
    let image_resource = core_process_images(data);
    // 駒サイズの調整
    let pone_size = 2;
    if(document.pone_converter.ccfolia_pone_size_check.checked) {
        let pone_size_dialog = Number(document.pone_converter.ccfolia_pone_size.value);
        if(pone_size_dialog) { pone_size = pone_size_dialog; }
    }
    // トークンの作成 64桁
    let token_strings = "0." + generate_pass(PASS_LOWER, 64);
    // __data.jsonの骨格を作成
    let obj = {
        meta: {version: "1.1.0"},
        entities: {
            room: {},
            items: {},
            decks: {},
            characters: {},
            scenes: {}
        },
        resources: {}
    };
    // resourceに画像ファイルを指定
    if(image_resource.hashImage) {
        obj.resources[`${image_resource.hashImage}.png`] = {type: "image/png"};
    }
    // キャラクターのID的なパスを発行（英数字20桁でランダム生成）
    let character_code = generate_pass(PASS_UPPER, 20);
    // キャラクターデータを作成
    let character_data = {
        name: data.base.name,
        playerName: "",
        memo: ccfolia_nexus(data),
        initiative: get_ability_value(getAblParams(data), "action", "human"),
        externalUrl: document.sheet_info.sheet_url.value,
        status: ccfolia_status(data),
        params: ccfolia_params(data),
        iconUrl: image_resource.hashImage ? `${image_resource.hashImage}.png` : "",
        faces: [],
        x: 0,
        y: 0,
        z: 0,
        angle: 0,
        width: pone_size,
        height: pone_size,
        active: true,
        secret: document.pone_converter.ccfolia_pone_secret.checked ? true : false,
        invisible: document.pone_converter.ccfolia_pone_invisible.checked ? true : false,
        hideStatus: document.pone_converter.ccfolia_pone_hideStatus.checked ? true : false,
        color: "#888888",
        roomId: null,
        commands: ccfolia_palette(),
        speaking: false
    };
    // オブジェクトデータに組み込み
    obj.entities.characters[character_code] = character_data;

    // zipファイルの作成とダウンロード
    let zip = new JSZip();
    // __data.json ファイルを作成
    let jsn = JSON.stringify(obj);
    const blob = new Blob([jsn], {type: 'application/json'});
    zip.file("__data.json", blob);
    // .token ファイルを作成
    const blob_token = new Blob([token_strings], {type: 'text/plain'});
    zip.file(".token", blob_token);
    // 画像ファイルを生成
    if(image_resource.hashImage) {
        zip.file(`${image_resource.hashImage}.png`, image_resource.imagesrc, {base64: true});
    }
    // zipファイルを出力してダウンロード
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, `${data.base.name}.zip`);
    });
}

// ルーツに「呪われし者」が含まれているかどうかを確認する
function check_CursedOne(data) {
    /*
    キャラクターシート倉庫で一度「手動入力」でルーツ名を入力した後、そのまま通常のブラッド選択に戻すと、rootmanualがそのまま持ち越されてしまうことに注意。
    当面はroot.bloodとroot.rootmanualの両方を指定して対応とする。
    ----------
    キャラクターシート倉庫で既存のルーツを選択する場合、ブラッドごとに"0"から順にナンバリングで保管されている。（0: 転校生, 1: 電脳魔術師, ... 6: 名探偵。プルダウンの上から順に番号振り）
    サプリメントでどのような順番に並べられるかは不明だが、GF誌の掲載順にデータが載るとすれば、「7: 帰還者, 8: ヴィラン, 9: 呪われし者」となる。
    そのため、無事最終サプリメントが発刊された場合の修正は if(root.blood === "ストレンジャー" && root.root === "9") で分岐を追加するのが良いと思われる。キャラシ倉庫を要確認。
    */
    let rootslist = [data.base.bloods.primary, data.base.bloods.secondary].concat(data.addRoots);
    for(let root of rootslist) {
        if(root.blood === "手動入力" && root.rootmanual === "呪われし者") { return true;}
    }
    return false;
}

// 初期文字列としてタブを指定数挿入する
function tabstr(i) {
    return i > 0 ? " ".repeat(i * 2) : "";
}

// 不等号 < > を文中に使用している場合、山括弧にコンバート
function avoid_inequality(str) {
    return str.replace(/</g, "〈").replace(/>/g, "〉");
}

// パスワード風文字列の作成（ココフォリア：トークン用64桁、キャラ駒ID用20桁）
// strは使用する文字列。定数にPASS_LOWER（数字＋英字小文字）、PASS_UPPER（数字＋英字小・大すべて）を用意しているので引数として指定する
function generate_pass(str, length=20) {
    let password = "";
	for (let i = 0; i < length; i++) {
		password += str.charAt(Math.floor(Math.random() * str.length));
	}
	return password;
}