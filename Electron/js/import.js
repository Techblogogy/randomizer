var fs = window.nodeRequire("fs");

var tasks = []; // Task List DB

var path_prefix = "../img/pack1/pages/";
var img_list = []; //["../img/12.png","../img/24.png"]
var cur_img_id = 0;

var max_maj = 2;
var max_min = 37;

window.onload = function () {
    // Returns All Images In Directory
    img_list = fs.readdirSync('Electron/img/pack1/pages/.')
    img_list = img_list.sort(function (a,b) {
        return parseInt(a.slice(0,-4))-parseInt(b.slice(0,-4));
    });
    $("#task_img").attr("src", path_prefix+img_list[cur_img_id]);

    $("#itm-smb").on('click', function () {
        rnd_add_item();
    });

    $("#itm-no").keyup(function (e) {
        if ($(this).val().length > 0) {
            $("#itm-smb").attr("disabled",false);
        } else {
            $("#itm-smb").attr("disabled",true);
        }
        if (e.keyCode == 13) {
            rnd_add_item();
        }
    });
}


function rnd_add_item() {
    var itm_txt = $("#itm-no").val(); // Item Text Input

    var range = []; // Range Items

    var itm = itm_txt.split("-"); // Seperated String Array
    var range_max = []; // First And Last Items In Range
    if (itm.length == 2) {
        // Convert Items Elements To Integer
        for (var i in itm) {
            var id = itm[i].split(".");
            for (var n in id) {
                id[n] = parseInt(id[n]);
            }
            if (id[1] > max_maj || id[2] > max_min) return false;

            range_max.push(id);
        }

        // Generate Range
        var min_itm = range_max[0];
        // range.push([min_itm[0],min_itm[1],min_itm[2]]);
        tasks.push({
            num: [min_itm[0],min_itm[1],min_itm[2]],
            img: [img_list[cur_img_id]]
        });

        // Count Items By Max, Major, Minor
        while (min_itm[0] != range_max[1][0] || min_itm[1] != range_max[1][1] || min_itm[2] != range_max[1][2]) {
            min_itm[2]++;
            if (min_itm[2] > max_min) {
                min_itm[2] = 1;

                min_itm[1]++;
                if (min_itm[1] > max_maj) {
                    min_itm[1] = 1;

                    min_itm[0]++;
                }
            }

            tasks.push(
                {
                    num: [min_itm[0],min_itm[1],min_itm[2]],
                    img: [img_list[cur_img_id]]
                }
            );
        }
    } else {
        return false;
    }

    console.log(tasks);

    // Next Image
    $("#itm-smb").attr("disabled",true);
    $("#itm-no").val(min_itm[0]+"."+min_itm[1]+"."+(min_itm[2]+1)+"-"+min_itm[0]+"."+min_itm[1]+".");
    cur_img_id++;
    if (cur_img_id >= img_list.length) {
        $("#itm-no").attr("disabled",true);
        $("#itm-no").val("");

        fs.writeFileSync("Electron/img/pack1/info.json", JSON.stringify(tasks));
        return;
    }
    $("#task_img").attr("src", path_prefix+img_list[cur_img_id]);

    return range;
}
