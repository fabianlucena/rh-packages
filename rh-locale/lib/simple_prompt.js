'use strict';

import prompt from 'prompt';

prompt.start();

export async function simplePrompt(message) {
    const data = await prompt.get(message);
    return data[message];
}
