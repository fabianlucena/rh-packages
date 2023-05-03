'use strinct';

export async function runSequentially(arr, func) {
    if (!arr)
        return;

    for(let i in arr)
        await func(arr[i]);
}