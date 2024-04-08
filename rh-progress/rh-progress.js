export class Progress {
    json = true;
    separator = '\n';
    progressJsonPropertyName = 'progress';
    progressMessagePropertyName = 'message';

    constructor(res, options) {
        options = { ...options };
        if (res.constructor.name === 'ServerResponse') {
            options.res = res;
        } else {
            options = {...res, ...options};
        }

        this.setOptions(options);
        this.init();
    }

    setOptions(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    async init(options) {
        this.setOptions(options);

        if (typeof this['Content-Type'] === 'string') {
            this.res.setHeader('Content-Type', this['Content-Type']);
        } else if (this['Content-Type'] !== false) {
            if (this.json) {
                this.res.setHeader('Content-Type', 'application/json');
            } else {
                this.res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            }
        }

        if (this['Content-Type'] !== false) {
            this.res.setHeader('Transfer-Encoding', this['Transfer-Encoding'] ?? 'chunked');
        }

        if (this.json) {
            this.res.write('{');
            if (this.progressJsonPropertyName) {
                this.res.write(`"${this.progressJsonPropertyName}":0`);
            }
        }
    }

    async end(data) {
        this.sendProgress(1, data, true);
        if (this.json) {
            this.res.write('}');
        }
        
        this.res.end();
    }

    async sendRaw(data) {
        if (data === undefined) {
            return;
        }

        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }

        if (this.separator) {
            data = this.separator + data;
        }

        this.res.write(data);
    }

    async send(data) {
        if (data === undefined) {
            return;
        }

        if (this.json) {
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
            }

            data = `,${data.slice(1, -1)}`;
        }

        this.sendRaw(data);
    }

    async sendProgress(progress, data, skipOnProgress) {
        let progressData;
        if (!skipOnProgress && this.onProgress) {
            progressData = this.onProgress(progress);
        }

        if (this.json) {
            data = {...data};
            if (this.progressJsonPropertyName) {
                data[this.progressJsonPropertyName] = progress;
            }

            if (progressData) {
                if (typeof progressData !== 'object' && this.progressMessagePropertyName) {
                    progressData = {[this.progressMessagePropertyName]: progressData};
                }

                if (typeof progressData === 'object') {
                    data = {...data, ...progressData};
                }
            }

            this.send(data);
        } else {
            this.send(progress.toString());
            this.send(progressData);
            this.send(data);
        }
    }
}