import {TranslationService} from '../services/translation.js';
import {Locale} from 'rf-locale';

let loc;
const languageCache = {};

export class LocaleController {
    static middleware() {
        return async (req, res, next) => {
            const acceptLanguage = req.header('accept-language');
            if (languageCache[acceptLanguage]) {
                req.loc = languageCache[acceptLanguage];
            } else {
                if (!loc) {
                    loc = new Locale({
                        driver: TranslationService.singleton()._gt,
                    });
                    
                    await loc.init();
                }

                const newLoc = loc.clone();
                newLoc.language = null;
                await newLoc.loadLanguageFromAcceptLanguage(acceptLanguage);
                await newLoc.init();
                languageCache[acceptLanguage] = newLoc;
                req.loc = newLoc;
            }
    
            next();
        };
    }

    static async post(req, res) {
        if (req.body?.gt) {
            const data = {};
            if (typeof req.body.gt === 'string') {
                data.gt = {};
                data.gt[req.body.gt] = await req.loc._(req.body.gt);
            } else if (Array.isArray(req.body.gt)) {
                data.gt = await req.loc.getTextRaw(req.body.gt);
            }

            res.status(200).send(data);
        } else if (req.body?.definition) {
            // eslint-disable-next-line no-unused-vars
            const {copy, driver, ...def} = req.loc;
            res.status(200).send(def);
        } else {
            res.status(200).send();
        }
    }
}