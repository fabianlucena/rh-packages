function pad02(number) {
    if (number < 10) {
        return '0' + number;
    }

    return number;
}

function pad03(number) {
    if (number < 10) {
        return '00' + number;
    }

    if (number < 100) {
        return '0' + number;
    }

    return number;
}

export class Log {
    static refSeed;
    logService;
    console = true;
    cache = [];
    show = {
        all:     false,
        error:   true,
        warning: true,
        info:    true,
        log:     true,
        debug:   true,
    };

    async setLogService(logService) {
        if (!Log.refSeed) {
            try {
                let newRef = await logService.getMaxRef();
                if (!newRef || isNaN(newRef)) {
                    Log.refSeed = 1;
                } else {
                    Log.refSeed = parseInt(newRef) + 1;
                }
                
                if (this.ref) {
                    if (this.ref > Log.refSeed) {
                        Log.refSeed = this.ref + 1;
                    } else {
                        this.ref = (Log.refSeed++);
                    }
                }
            } catch(e) {
                if (!Log.refSeed) {
                    Log.refSeed = 1;
                }
            }
        }

        this.logService = logService;
        await this.flushCache();
    }

    clone() {
        const ref = (Log.refSeed++);

        const log = new Log();
        for (const k in this) {
            if (k !== 'ref') {
                log[k] = this[k];
            }
        }

        log.ref = ref;

        return log;
    }

    async flushCache() {
        try {
            if (!this.logService) {
                return;
            }

            if (!this.ref || isNaN(this.ref)) {
                this.ref = (Log.refSeed++);
            }
                
            for (const line of this.cache) {
                await this.logService.create({...line, ref: this.ref});
            }

            this.cache = [];
            this.checkCache = false;
        } catch(e) {
            console.error(e);
        }
    }

    dateFormat(date) {
        return date.getFullYear() + '-' + pad02(date.getMonth() + 1) + '-' + pad02(date.getDate(), 2) + ' ' + date.toLocaleTimeString() + '.' + pad03(date.getMilliseconds());
    }

    async msg(type, message, data) {
        if (!this.ref || isNaN(this.ref)) {
            this.ref = (Log.refSeed++);
        }

        const line = {
            dateTime: new Date,
            ref: this.ref,
            type,
            sessionId: data?.sessionId ?? data?.session?.id ?? ((!isNaN(data?.session))? data.session: undefined),
            message,
        };

        if (data) {
            line.data = JSON.parse(JSON.stringify(data));
        }

        if (typeof line.message !== 'string') {
            if (line.message.toString) {
                line.message = line.message.toString();
            } else {
                line.message = JSON.stringify(line.message);
            }
        }

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
            let text = `${this.dateFormat(line.dateTime)} - ${ type ?? '{NO TYPE}'} - ${line.session ?? line.sessionId ?? '{NO SESSION}'} - ${message ?? '{NO MESSAGE}'}`;
            if (data) {
                text += ' - ' + JSON.stringify(data);
            }

            switch (TYPE) {
            case 'ERROR':   console.error(text); break;
            case 'WARN':
            case 'WARNING': console.warn(text); break;
            case 'INFO':    console.info(text); break;
            default: console.log(text);
            }
        }

        try {
            if (this.logService) {
                if (this.checkCache) {
                    await this.flushCache();
                }

                await this.logService.create(line);
            } else {
                this.cache.push(line);
                this.checkCache = true;
            }
        } catch(e) {
            this.cache.push(line);
            this.checkCache = true;
        }
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
