
function sum(arr) {
    return arr.reduce(function (s, a) {
        return s + a;
    }, 0)
}

module.exports.sum = sum;