'use strinct';

export async function runSequentially(arr, func) {
    if (!arr)
        return;

    let result;
    if (arr instanceof Array)
        result = [];
    else
        result = {};

    for(let key in arr)
        result[key] = await func(arr[key], key);

    return result;
}