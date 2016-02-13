window.onload = function () {
    $("#itm-smb").on('click', function () {
        rnd_add_item();
    });

    $("#itm-no").keyup(function (e) {
        if (e.keyCode == 13) {
            rnd_add_item();
        }
    });
}

var max_maj = 2;
var max_min = 10;

function rnd_add_item() {
    var itm_txt = $("#itm-no").val();

    var itm = itm_txt.split("-");
    var range_max = [];
    var range = [];
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
        range.push([min_itm[0],min_itm[1],min_itm[2]]);

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

            range.push([min_itm[0],min_itm[1],min_itm[2]]);
        }
        console.log(range);
    } else {
        return false;
    }

    return range;
}
