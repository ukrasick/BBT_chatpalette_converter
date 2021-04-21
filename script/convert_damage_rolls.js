// 攻撃力テキストの切り分け
function separateAttackFormula(str) {
    //人間状態の攻撃力は( )内を考慮しない
    var str_human = str.replace(/\([^\(\)]*\)/gi, "");
    // 魔獣状態の攻撃力は( )内を考慮して作成する
    var str_beast = str;
    var str_regex = str_beast.match(/([d\d\+]*)(?:\()([d\d\+]*)(?:\))/i);
    while (str_regex) {
        // 確認用 [0]:matchした文字列全体　[1]:( )の外側　[2]:( )の内側
        console.log(str_regex);
        console.log("str_regex[0]: " + str_regex[0]);
        console.log("str_regex[1]: " + str_regex[1]);
        console.log("str_regex[2]: " + str_regex[2]);
        // 置き換え用の文字列をリセット
        var regex_convert = void(0);

        // regex[2]の行頭が「+」の場合、補正値を単純に加算とみなして[1][2]両方を計上
        if(str_regex[2].match(/^\+/)) {
            console.log("チェック：[2]の行頭に符号");
            regex_convert = [str_regex[1], str_regex[2]].join("");
            console.log(regex_convert);
        }
        // regex[1]とregex[2]の両方が途中で「+」を含む場合、式全体を置換するものとしてすべて置き換える
        if(str_regex[1].match(/[^\+]*\+.*/) && str_regex[2].match(/[^\+]*\+.*/)) {
            console.log("チェック：[1][2]の途中に符号");
            if(!regex_convert) { regex_convert = str_regex[2]; }
            console.log(regex_convert);
        }
        // regex[1]が途中で「+」を含む場合、最後の+の直後のみがmatchするのでそこだけ書き換え
        if(str_regex[1].match(/[^\+]*\+.*/)) {
            console.log("チェック：[1]の途中に符号");
            if(!regex_convert){
                var array_regex = str_regex[1].split(/\+/g);
                if(array_regex.length > 1) { array_regex.pop(); }
                array_regex.push(str_regex[2]);
                regex_convert = array_regex.join("+");
            }
            console.log(regex_convert);
        }
        // regexが上記のどれにも当てはまらなかった場合は、素直に全体を置き換える
        if(!regex_convert) { regex_convert = str_regex[2]; }
        str_beast = str_beast.replace(str_regex[0], regex_convert);
        console.log("str_beast: " + str_beast);
        // 書き換えた後の攻撃力式に( )がまだ残っているかを確認
        // 残っている場合はループを継続し、なくなるまで繰り返す
        str_regex = str_beast.match(/([d\d\+]*)(?:\()([d\d\+]*)(?:\))/i);
    }
    // 確認用
    console.log("-----");
    console.log("str_human/Complete: " + str_human);
    console.log("str_beast/Complete: " + str_beast);
    // returnする文字列を作成
    var result = {human: str_human, beast: str_beast};
    if(str_human === str_beast) { delete result.beast; }
    return result;
}