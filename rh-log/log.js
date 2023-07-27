'use strict';


function pad02(number) {
    if (number < 10)
        return '0' + number;

    return number;
}

function pad03(number) {
    if (number < 10)
        return '00' + number;

    if (number < 100)
        return '0' + number;

    return number;
}

export class Log {
    #logService;
    console = true;
    cache = [];
    show = {
        all:     true,
        error:   true,
        warning: true,
        info:    true,
        log:     true,
        debug:   true,
    };

    get logService() {
        return this.#logService;
    }

    set logService(logService) {
        this.#logService = logService;
        this.flushCache();
    }

    flushCache() {
        if (!this.#logService)
            return;
            
        for (const line of this.cache)
            this.#logService.create(line);

        this.cache = [];
    }

    dateFormat(date) {
        return date.getFullYear() + '-' + pad02(date.getMonth() + 1) + '-' + pad02(date.getDate(), 2) + ' ' + date.toLocaleTimeString() + '.' + pad03(date.getMilliseconds());
    }

    msg(type, message, data) {
        const line = {
            dateTime: new Date,
            type,
            message,
            data,
        };

        const TYPE = type.toUpperCase();
        if (this.show.all) {
            switch (TYPE) {
            case 'ERROR':   if (!this.show.error)   return; break;
            case 'WARN':   
            case 'WARNING': if (!this.show.warning) return; break;
            case 'INFO':    if (!this.show.info)    return; break;
            case 'DEBUG':   if (!this.show.debug)   return; break;
            }
        }

        if (this.console) {
            let text = `${this.dateFormat(line.dateTime)} - ${type ?? '{NO TYPE}'} - ${message ?? '{NO MESSAGE}'}`;
            if (data)
                text += ' - ' + JSON.stringify(data);

            switch (TYPE) {
            case 'ERROR':   console.error(text); break;
            case 'WARN':
            case 'WARNING': console.warn(text); break;
            case 'INFO':    console.info(text); break;
            default: console.log(text);
            }
        }

        if (this.#logService)
            this.#logService.create(line);
        else
            this.cache.push(line);
    }

    log(message, data) {
        return this.msg('LOG', message, data);
    }

    info(message, data) {
        return this.msg('INFO', message, data);
    }

    debug(message, data) {
        return this.msg('DEBUG', message, data);
    }

    error(message, data) {
        return this.msg('ERROR', message, data);
    }

    warning(message, data) {
        return this.msg('WARNING', message, data);
    }
}
