const yyyymmdd = () => {
    var now = new Date();
    var d = now.getDate();
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var y = now.getFullYear();
    var m = months[now.getMonth()];
    // return '' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
    return '' + m + ' ' + y ;
}

console.log(yyyymmdd());
