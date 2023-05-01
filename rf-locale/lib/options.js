'use strict';

import {camelize} from './utils.js';

export function getOptionsFromArgs(options, conf) {
    options ??= {};
    conf ??= {};
    
    const args = process.argv.slice(2);
    for (let i = 0, e = args.length; i < e; i++) {
        let arg = args[i];
        let isSwitch = conf.switchOptions.includes(arg);
        let isValue = conf.valueOptions.includes(arg);
        let isMultiple = conf.multipleOptions.includes(arg);

        if (!(isSwitch || isValue || isMultiple)) {
            if (!conf.defaultOption) {
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
                return options;
            }

            const newArg = conf.defaultOption;

            isSwitch = conf.switchOptions.includes(newArg);
            isValue = conf.valueOptions.includes(newArg);
            isMultiple = conf.multipleOptions.includes(newArg);
            if (!(isSwitch || isValue || isMultiple)) {
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
                return options;
            }

            arg = newArg;
            i--;
        }

        if (isSwitch) {
            let name = arg.trim();
            while (name[0] === '-')
                name = name.substring(1);

            options[camelize(name)] = true;
        } else if (isValue) {
            let name = arg.trim();
            while (name[0] === '-')
                name = name.substring(1);

            i++;
            options[camelize(name)] = args[i];
        } else if (isMultiple) {
            let name = arg.trim();
            while (name[0] === '-')
                name = name.substring(1);

            name = camelize(name) + 's';

            i++;
            if (!options[name])
                options[name] = [];

            options[name].push(args[i]);
        }
    }

    return options;
}
