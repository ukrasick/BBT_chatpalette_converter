// 出力の基本設定
function setup_basic(tool) {
    // prefix_str: 各ダイスロールの文字列の前につける文字列があれば入力。基本的にはTRPGスタジオ用の機能。
    // ability: 能力値をチャットパレットに埋め込むかどうかをtrue/falseで記入。trueの場合、チャットパレットの下に記載する。
    // reserved: 予約語の機能に対応しているかをtrue/falseで記入。trueの場合は2BB+{肉体}のように、falseの場合は数値を平書きする。
    // citation: イニシアティブ表やキャラクター駒に設定された【能力値】からの引用が可能なツールかどうかをtrue/falseで記入。主に%{人間性}の表記をするかどうかに影響。
    // mutation: 変異段階のクリティカル値修正を、予約語を利用して記入する。パレットの1行目に //変異段階=0 という行が追加され、判定文が 2BB+{肉体}@-{変異} という表記を基本にする。
    // pone: 駒変換器の呼び出しを行うツールならtrueを設定。

    switch(tool) {
        case "udonarium":
            result = {prefix_str: "", ability: false, reserved: true, mutation: false, citation: true, pone: true};
            break;
        case "ccfolia":
            result = {prefix_str: "", ability: false, reserved: true, mutation: false, citation: true, pone: true};
            break;
        case "nekotaku":
            result = {prefix_str: "", ability: true, reserved: true, mutation: true, citation: false};
            break;
        case "tekey":
            result = {prefix_str: "", ability: true, reserved: true, mutation: false, citation: true};
            break;
        case "trpgstudio":
            result = {prefix_str: "/ ", ability: false, reserved: false, mutation: false, citation: false};
            break;
        case "quoridorn":
            result = {prefix_str: "", ability: true, reserved: true, mutation: false, citation: true};
            break;
        case "soldoresol":
            result = {prefix_str: "", ability: false, reserved: false, mutation: false, citation: false};
            break;
        case "gorrilla":
            result = {prefix_str: "", ability: false, reserved: false, mutation: false, citation: false};
            break;
        default:
            result = {prefix_str: "", ability: false, reserved: false, mutation: false, citation: true};
            break;
    }
    return result;
}

// Palette Converter × オンセツール駒変換機能
function setup_PoneConverter(obj) {
    // 対応するツールが選択されたかをチェック
    let checker = setup_basic(obj.value).pone;
    document.getElementById("section_ex").style.display = checker ? "block" : "none";
    document.output_pone.using.checked = checker ? true : false;
    document.pone_converter.style.display = checker ? "block" : "none";
    document.pone_converter.quick.checked = checker ? true : false;
    // ユドナリウム固有機能：バフパレット 表示オフ
    document.getElementById("pone_buffpalette").style.display = "none";
    document.getElementById("pone_ccfolia_config").style.display = "none";

    // 対応しないツールの場合、一時保存しているデータを消去
    if(!checker) {
        reserved_data = false;
        pone_output_ready();
        document.converter_output.pone.style.display = "none";
        return;
    }

    let option = setup_PoneOutput(obj.value);
    // 大罪（愛の初期数調整）
    if(option.greatsin) {
        document.getElementById("pone_greatsin").style.display = "block";
    }
    // 初期財産点（魔艦や鼻高天狗などによるプリプレイでの財産点増減）
    if(option.initialcredit) {
        document.getElementById("pone_initialcredit").style.display = "block";
    }
    // 絆・エゴ情報
    if(option.nexus) {
        document.getElementById("pone_nexus").style.display = "block";
    }
    // チャットパレット
    if(option.palette) {
        document.getElementById("pone_palette").style.display = "block";
    }
    // ユドナリウムリリィ固有機能：バフパレット
    if(obj.value == "udonarium") {
        document.getElementById("pone_buffpalette").style.display = "block";
        document.pone_converter.buffpalette_content.value = setup_buffpalette_default();
    }
    // ココフォリア固有機能：キャラクター駒の表示に関する設定
    if(obj.value =="ccfolia") {
        document.getElementById("pone_ccfolia_config").style.display = "block";
    }
}

function setup_PoneOutput(system) {
    // tool : オンラインセッション用ツールの名称
    // greatsin : 「大罪を取得している」のセクション表示
    // initialcredit : 「初期財産点の調整」のセクション表示
    // nexus : 絆・エゴ情報の出力セクション表示
    // palette : チャットパレットを駒のデータに組み込む機能
    // status : キャラクターの基本ステータスを駒のデータに組み込む機能（オプション設定なし、trueの場合は必ずそうする）
    // ability : 能力値を駒のデータに組み込む機能（オプション設定なし、trueの場合は必ずそうする）
    // image : キャラクターシートの画像を駒のデータに組み込む機能（オプション設定なし、trueの場合は必ずそうする）
    let result;
    switch(system) {
        case "udonarium":
            result = {"tool": "udonarium", "greatsin": true, "initialcredit": true, "nexus": true, "palette": true, "status": true, "ability": true, "image":true};
            break;
        case "ccfolia":
            result = {"tool": "ccfolia", "greatsin": true, "initialcredit": true, "nexus": true, "palette": true, "status": true, "ability": true, "image":true};
            break;
        default:
            result = {"tool": system, "greatsin": false, "initialcredit": false, "nexus": false, "palette": false, "status": false, "ability": false, "image":false};
            break;
    }
    return result;
}

function setup_buffpalette_default() {
    let text = [
        "邪毒X クリンナップにXD6点ダメージ",
        "重圧 アーツ使用不可",
        "狼狽 達成値-5、移動不可",
        "放心 達成値-5 0",
        "束縛 移動・ドッジ不可",
        "暴走 ガード・カバーリング不可",
        "翻弄：●● 対象を含まない判定-3",
        "恐怖：●● 対象を含む判定-3"
    ];
    return text.join("\n");
}