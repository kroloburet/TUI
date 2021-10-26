"use strict";

/**
 * TUI scripts
 *
 * Примеры применения и документация по API
 * на странице ./index.html
 *
 * @see ./index.html
 * @author Sergey Nizhnik <kroloburet@gmail.com>
 */
window.TUI = (function () {

    /**
     * Private
     */

    /**
     * TUI не будет обрабатывать элементы
     * с этими селекторами и их дочерние элементы
     *
     * @type {DOMStringList}
     * @private
     */
    const _disabledNodes = [`.TUI_disabled-node`];

    /**
     * Является ли элемент потомком запрещённого
     * узла или сам запрещён
     *
     * @param {Element} el Проверяемый элемент
     * @return {boolean}
     * @private
     */
    function _isDisabledNode(el = null) {
        if (!el) {
            if ((event instanceof Event) && (event.currentTarget instanceof Element)) el = event.currentTarget;
        } else {
            return _disabledNodes.some(selector => {
                let find = el.closest(selector);
                if (find) {
                    let entity = find == el ? `узел` : `элемент`;
                    console.warn(`TUI обнаружил заблокированный ${entity}:\n`, el, `\nСмотри: ${origin}/TUI/#disabledNodes`);
                }
                return find;
            });
        }
    }

    /**
     * Точка входа для плагинов
     *
     * @param {object} methods Методы плагина
     * @return {object} Метод плагина
     * @private
     */
    function _is(methods) {
        if (this[methods]) {
            // Метод существует
            return this[methods].apply(this, [].slice.call(arguments, 1));
        } else if (typeof methods === `object` || !methods) {
            // Метод не передан - запустить "init"
            return this.init.apply(this, arguments);
        } else {
            // Метод не существует
            return console.error(`Вы о чём?! Здесь нет никакого "${methods}"`);
        }
    }

    /**
     * Проверка метки активации плагина на элементе.
     *
     * @param {object} el Проверяемый элемент
     * @param {string} selfName Имя плагина
     * @return {boolean}
     * @private
     */
    function _isActivate(el, selfName) {
        return el.classList.contains(`TUI_${selfName}-activated`);
    }

    /**
     * Установить метку активации плагина на элементе
     *
     * @param {object} el Элемент для установки метки
     * @param {string} selfName Имя плагина
     * @private
     */
    function _markActivate(el, selfName) {
        return el.classList.add(`TUI_${selfName}-activated`);
    }

    /**
     * Удалить метку активации плагина на элементе
     * вместе с динамически созданными классами
     *
     * @param {object} el Элемент для удаления метки
     * @param {string} selfName Имя плагина
     * @private
     */
    function _unmarkActivate(el, selfName) {
        el.querySelectorAll(`[class^=TUI_${selfName}]`).forEach(child => {
            let list = [...child.classList].filter(cssClass => new RegExp(`TUI_${selfName}`).test(cssClass));
            child.classList.remove(...list);
        });
        return el.classList.remove(`TUI_${selfName}-activated`);
    }

    /**
     * Public
     */

    return {

        /***************************************
         * Helpers
         **************************************/

        /**
         * Переключение отображения элемента
         *
         * @param {string} id Идентификатор элемента
         * @param {string} display Значение CSS-свойства display видимого элемента
         * @return {object} Элемент
         */
        Toggle(id, display = `block`) {
            const selfName = `Toggle`;
            const content = document.getElementById(id);
            if (!content || _isDisabledNode()) return;
            // Обработка появления/скрытия
            const visible = content.style.display;
            if (visible === `none` || content.hidden) {
                content.style.display = display;
                content.hidden = false;
            } else {
                content.style.display = `none`;
            }
            return content;
        },

        /**
         * Всплывающая подсказка
         *
         * @param {object} trigger "this" Ссылка на триггер
         * @param {string} hideEvent Событие для скрытия подсказки
         * @return {Node} Node подсказки
         */
        Hint(trigger, hideEvent = `mouseout`) {
            const selfName = `Hint`;
            const hint = trigger.nextElementSibling;
            if (!hint || _isDisabledNode(trigger)) return;
            const w = hint.offsetWidth;
            const h = hint.offsetHeight;
            const win = window;
            const hide = () => {
                hint.classList.remove(`TUI_${selfName}-show`);
                hint.style.left = 0;
            }
            // Обработка положения подсказки
            trigger.addEventListener(`mousemove`, e => {
                const cursor = {x: e.pageX, y: e.pageY};
                // Дистанция указателя до правого и нижнего края
                const distance = {
                    right: win.innerWidth - (cursor.x - win.pageXOffset),
                    bottom: win.innerHeight - (cursor.y - win.pageYOffset)
                };
                // Разместить слева указателя если близко к правому краю
                hint.style.left = distance.right < w
                    ? cursor.x - w < 0
                        ? 0 // Закрепить у левого края если значение отрицательное
                        : cursor.x - w + `px`
                    : (cursor.x + 15) + `px`;
                // Разместить над указателем если близко к нижнему краю
                hint.style.top = distance.bottom < (h + 15)
                    ? (cursor.y - 15) - h + `px`
                    : (cursor.y + 15) + `px`;
            });
            // Показать подсказку
            hint.classList.add(`TUI_${selfName}-show`);
            // Обработка скрытия подсказки
            document.addEventListener(hideEvent, hide);
            return hint;
        },

        /**
         * Лимит ввода символов в поле
         *
         * @param {object} trigger "this" Ссылка на поле
         * @param {number|string} limit Лимит символов
         * @return {object} Поле
         */
        Lim(trigger, limit = 50) {
            if(_isDisabledNode(trigger)) return;
            const selfName = `Lim`;
            if (typeof limit !== `number`) limit = parseInt(limit);
            let val = trigger.value;
            let counter = trigger.parentElement.querySelector(`span.TUI_${selfName}`);
            const cut = () => trigger.value = trigger.value.substr(0, limit);
            // Создать и прикрепить счётчик если не определен
            if (!counter) {
                counter = document.createElement(`span`);
                // Отступ в поле (начальный)
                let paddingR = trigger.style.paddingRight;
                counter.classList.add(`TUI_${selfName}`);
                counter.textContent = limit.toString();
                trigger.after(counter);
                trigger.addEventListener('blur', () => {
                    // Обрезать значение до лимита
                    cut();
                    // Удалить счётчик
                    counter.remove();
                    // Вернуть начальный отступ полю
                    trigger.style.paddingRight = paddingR;
                });
                // Отступ полю на ширину счётчика
                trigger.style.paddingRight = counter.offsetWidth + `px`;
            }
            // Обработка длины значения поля
            if (val.length <= limit) {
                counter.textContent = (limit - val.length).toString();
            } else {
                cut();
                counter.textContent = `0`;
            }
            return trigger;
        },

        /**
         * Переход к элементу
         *
         * @param {string|null} selectorId Селектор id элемента или ничего
         * @return {object} Элемент
         */
        GoTo(selectorId = null) {
            if (_isDisabledNode()) return;
            const selfName = `GoTo`;
            // id элемента или хеш в url
            const target = selectorId || location.hash;
            if (!target) return;
            const el = document.getElementById(target.replace(/^#/, ``));
            setTimeout(() => {
                el.scrollIntoView({
                    behavior: `smooth`,
                    block: `start`,
                });
            }, 200);
            return el;
        },

        // /**
        //  * Шаблон Хелпера TUI
        //  */
        // Helper(prop) {
        //     const selfName = `Helper`; // arguments.callee.name
        //     console.log(`Hello from TUI.Helper()`, this, arguments);
        // },

        /***************************************
         * Plugins
         **************************************/

        /**
         * Уведомления
         */
        Notice() {
            const selfName = `Notice`;
            const defConf = {
                text: `обработка...`,
                className: `TUI_notice-process`,
                delay: null,
                callback: null,
            };
            const methods = {

                /**
                 * Активация плагина
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Node} Node уведомления
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    let notice = document.querySelector(`.TUI_${selfName}`);
                    let id = `_` + Date.now();
                    // Уведомление ещё не создано
                    if (!notice) {
                        const box = document.createElement(`div`);
                        notice = document.createElement(`div`);
                        box.classList.add(`TUI_${selfName}-box`);
                        box.prepend(notice);
                        document.body.classList.add(`TUI_${selfName}-body`);
                        document.body.append(box);
                    }
                    // Уведомление создано
                    notice.id = id;
                    notice.className = `TUI_${selfName} ` + conf.className;
                    notice.innerHTML = conf.text;
                    if (conf.delay) {
                        setTimeout(() => {
                            this.kill(id);
                            typeof conf.callback === `function` ? conf.callback() : null;
                        }, conf.delay)
                    }
                    return notice;
                },

                /**
                 * Деактивация плагина
                 *
                 * @param {string|null} id Идентификатор узла уведомления или null
                 */
                kill(id = null) {
                    let notice = document.querySelector(`.TUI_${selfName}` + (id ? `#${id}` : ``));
                    if (!notice) return;
                    notice.closest(`.TUI_${selfName}-box`).remove();
                    document.body.classList.remove(`TUI_${selfName}-body`);
                },
            };
            return _is.apply(methods, arguments);
        },

        /**
         * Всплывающее окно
         *
         * @param {string|null} id Идентификатор элемента или ничего
         * @return {object|HTMLAllCollection} Узел окна или коллекция узлов
         */
        Popup(id = null) {
            const selfName = `Popup`;
            if (!id || !document.getElementById(id)) {

                // Активация плагина на элементах коллекции
                const collection = document.querySelectorAll(`.TUI_${selfName}`);
                collection.forEach(pop => {
                    if(_isDisabledNode(pop) || _isActivate(pop, selfName)) return;
                    // Добавить обёртку, кнопки и события
                    const box = document.createElement(`div`);
                    const close = document.createElement(`span`);
                    const hide = () => {
                        box.classList.remove(`TUI_${selfName}-show`);
                        document.body.classList.remove(`TUI_${selfName}-body`);
                    }
                    box.classList.add(`TUI_${selfName}-box`);
                    box.onclick = e => e.target === box ? hide() : null;
                    close.classList.add(`TUI_${selfName}-close`, `fas`, `fa-times-circle`);
                    close.onclick = hide;
                    pop.prepend(close);
                    box.prepend(pop);
                    document.body.append(box);
                    // Пометить элемент как активный
                    _markActivate(pop, selfName);
                });
                return collection;
            } else {

                // Показать popup по id
                const pop = document.getElementById(id);
                if (_isDisabledNode(pop)) return;
                document.body.classList.add(`TUI_${selfName}-body`);
                pop.closest(`.TUI_${selfName}-box`).classList.add(`TUI_${selfName}-show`);
                return pop;
            }
        },

        /**
         * Меню
         */
        Menu() {
            const selfName = `Menu`;
            const defConf = {
                selector: `.TUI_${selfName}`,
                icon: `&#8801;`,
            };
            const methods = {

                /**
                 * Активация плагина на элементе/тах
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Array} Коллекция из conf.selector
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    const collection = [...document.querySelectorAll(conf.selector)]
                        .filter(el => el.tagName === `UL`);
                    collection.forEach(menu => {
                        if (_isDisabledNode(menu)) return;
                        // Деактивировать текущий чтобы переписать конфиг
                        if (_isActivate(menu, selfName)) methods.kill(conf.selector);
                        // Прикрепить элементы управления и классы, прослушку событий
                        const toggle = el => el.classList.toggle(`TUI_${selfName}-show`);
                        const btn = document.createElement(`i`);
                        btn.classList.add(`TUI_${selfName}-btn`);
                        btn.innerHTML = conf.icon;
                        btn.onclick = () => toggle(menu);
                        menu.before(btn);
                        menu.querySelectorAll(`ul`).forEach(ul => {
                            const subBtn = document.createElement(`i`);
                            subBtn.classList.add(`TUI_${selfName}-sub-btn`);
                            subBtn.innerHTML = conf.icon;
                            subBtn.onclick = () => toggle(ul);
                            ul.previousElementSibling.classList.add(`TUI_${selfName}-sub-link`);
                            ul.before(subBtn);
                        });
                        // Пометить корневой "li" с дочерней ссылкой на текущую страницу
                        menu.querySelectorAll(`a`).forEach(a => {
                            const l = location;
                            if (l.pathname === a.href || l.pathname + l.search === a.href || l.href === a.href)
                                a.closest(`${conf.selector} > li`).classList.add(`TUI_${selfName}-mark`);
                        });
                        // Пометить как активный
                        _markActivate(menu, selfName);
                    });
                    return collection;
                },

                /**
                 * Деактивация плагина на элементе/тах
                 *
                 * @param {string} selector Селектор элемента/тов
                 * @return {Array} Коллекция элементов
                 */
                kill(selector = defConf.selector) {
                    const collection = [...document.querySelectorAll(selector)]
                        .filter(el => el.tagName === `UL` && _isActivate(el, selfName));
                    collection.forEach(menu => {
                        if (_isDisabledNode(menu)) return;
                        // Удалить динамически созданные кнопки и классы
                        menu.previousElementSibling.remove();
                        menu.querySelectorAll(`.TUI_${selfName}-sub-btn`).forEach(el => el.remove());
                        // Удалить метку активации
                        _unmarkActivate(menu, selfName);
                    });
                    return collection;
                },
            };
            return _is.apply(methods, arguments);
        },

        /**
         * Tабы
         */
        Tab() {
            const selfName = `Tab`;
            const defConf = {
                selector: `.TUI_${selfName}`,
            };
            const methods = {

                /**
                 * Активация плагина на элементе/тах
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Array} Коллекция из conf.selector
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    const collection = [...document.querySelectorAll(conf.selector)]
                        .filter(el => el.tagName === `DL`);
                    collection.forEach(tab => {
                        if (_isDisabledNode(tab)) return;
                        // Деактивировать текущий чтобы переписать конфиг
                        if (_isActivate(tab, selfName)) methods.kill(conf.selector);
                        // Добавить классы и прослушку событий
                        const dtAll = tab.querySelectorAll(`dt`);
                        let visibleFlag = false;
                        dtAll.forEach(dt => {
                            dt.onclick = ({target}) => {
                                target.parentElement.querySelectorAll(`dt`)
                                    .forEach(dt => dt.classList.remove(`TUI_${selfName}-show`));
                                target.classList.add(`TUI_${selfName}-show`);
                            };
                            if (dt.classList.contains(`TUI_${selfName}-show`)) visibleFlag = true;
                        });
                        if (!visibleFlag) dtAll[0].classList.add(`TUI_${selfName}-show`);
                        // Пометить элемент как активный
                        _markActivate(tab, selfName);
                    });
                    return collection;
                },

                /**
                 * Деактивация плагина на элементе/тах
                 *
                 * @param {string} selector Селектор элемента/тов
                 * @return {Array} Коллекция элементов
                 */
                kill(selector = defConf.selector) {
                    const collection = [...document.querySelectorAll(selector)]
                        .filter(el => el.tagName === `DL` && _isActivate(el, selfName));
                    collection.forEach(tab => {
                        if (_isDisabledNode(tab)) return;
                        // Удалить привязку событий
                        tab.querySelectorAll(`dt`)
                            .forEach(dt => dt.onclick = null);
                        // Удалить метку активации
                        _unmarkActivate(tab, selfName);
                    });
                    return collection;
                },
            };
            return _is.apply(methods, arguments);
        },

        /**
         * Input type="file"
         */
        InputFile() {
            const selfName = `InputFile`;
            const defConf = {
                selector: `.TUI_${selfName}`,
                icon: `<i class="fas fa-folder-open">`,
            };
            const methods = {

                /**
                 * Активация плагина на элементе/тах
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Array} Коллекция из conf.selector
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    const collection = [...document.querySelectorAll(conf.selector)]
                        .filter(el => el.tagName === `INPUT` && el.type === `file`);
                    collection.forEach(inputFile => {
                        if (_isDisabledNode(inputFile)) return;
                        // Деактивировать текущий чтобы переписать конфиг
                        if (_isActivate(inputFile, selfName)) methods.kill(conf.selector);
                        // Добавить элементы, классы и прослушку событий
                        const info = document.createElement(`span`);
                        const innerInfo = () => {
                            let files = inputFile.files;
                            let name = ``;
                            let size = 0;
                            if (files && files.length) {
                                // Файлы выбраны
                                [...files].forEach(file => {
                                    name += files.length > 1 ? `<span class="TUI_${selfName}-val">${file.name}</span>` : file.name;
                                    size += file.size;
                                });
                                // Общий размер файлов в mb
                                size = (size / 1048576).toFixed(3);
                                // Отобразить список файлов и размер в информационном элементе
                                info.innerHTML = `${name} (${size} Mb)`;
                            } else {
                                // Файлы не выбраны
                                info.innerHTML = conf.icon;
                            }
                        };
                        // Прикрепить инфо-элемент
                        info.classList.add(`TUI_${selfName}-info`);
                        info.innerHTML = conf.icon;
                        inputFile.after(info);
                        // Отобразить информацию если файлы уже выбраны
                        innerInfo();
                        inputFile.onchange = innerInfo;
                        // Пометить элемент как активный
                        _markActivate(inputFile, selfName);
                    });
                    return collection;
                },

                /**
                 * Деактивация плагина на элементе/тах
                 *
                 * @param {string} selector Селектор элемента/тов
                 * @return {Array} Коллекция элементов
                 */
                kill(selector = defConf.selector) {
                    const collection = [...document.querySelectorAll(selector)]
                        .filter(el => el.tagName === `INPUT` && el.type === `file` && _isActivate(el, selfName));
                    collection.forEach(inputFile => {
                        if (_isDisabledNode(inputFile)) return;
                        // Вернуть элемент к состоянию до активации
                        inputFile.nextElementSibling.remove();
                        inputFile.onchange = null;
                        _unmarkActivate(inputFile, selfName);
                    });
                    return collection;
                },
            };
            return _is.apply(methods, arguments);
        },

        /**
         * Input type="range"
         */
        InputRange() {
            const selfName = `InputRange`;
            const defConf = {
                selector: `.TUI_${selfName}`,
            };
            const methods = {

                /**
                 * Активация плагина на элементе/тах
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Array} Коллекция из conf.selector
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    const collection = [...document.querySelectorAll(conf.selector)]
                        .filter(el => el.tagName === `INPUT` && el.type === `range`);
                    collection.forEach(inputRange => {
                        if (_isDisabledNode(inputRange)) return;
                        // Деактивировать текущий чтобы переписать конфиг
                        if (_isActivate(inputRange, selfName)) methods.kill(conf.selector);
                        // Добавить элементы, классы и прослушку событий
                        const info = document.createElement(`span`);
                        info.classList.add(`TUI_${selfName}-info`);
                        info.innerText = inputRange.value || `0`;
                        inputRange.after(info);
                        inputRange.onchange = () => info.innerText = inputRange.value;
                        // Пометить элемент как активный
                        _markActivate(inputRange, selfName);
                    });
                    return collection;
                },

                /**
                 * Деактивация плагина на элементе/тах
                 *
                 * @param {string} selector Селектор элемента/тов
                 * @return {Array} Коллекция элементов
                 */
                kill(selector = defConf.selector) {
                    const collection = [...document.querySelectorAll(selector)]
                        .filter(el => el.tagName === `INPUT` && el.type === `range` && _isActivate(el, selfName));
                    collection.forEach(inputRange => {
                        if (_isDisabledNode(inputRange)) return;
                        // Вернуть элемент к состоянию до активации
                        inputRange.nextElementSibling.remove();
                        inputRange.onchange = null;
                        _unmarkActivate(inputRange, selfName);
                    });
                    return collection;
                },
            };
            return _is.apply(methods, arguments);
        },

        /**
         * Input type="number"
         */
        InputNumber() {
            const selfName = `InputNumber`;
            const defConf = {
                selector: `.TUI_${selfName}`,
                incIcon: `&plus;`,
                decIcon: `&minus;`,
                info: `Поставьте курсор в поле и крутите колёсико мыши ;)`,
            };
            const methods = {

                /**
                 * Активация плагина на элементе/тах
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Array} Коллекция из conf.selector
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    const collection = [...document.querySelectorAll(conf.selector)]
                        .filter(el => el.tagName === `INPUT` && el.type === `number`);
                    collection.forEach(inputNumber => {
                        if (_isDisabledNode(inputNumber)) return;
                        // Деактивировать текущий чтобы переписать конфиг
                        if (_isActivate(inputNumber, selfName)) methods.kill(conf.selector);
                        // Добавить элементы, валидацию и прослушку событий
                        const event = new Event(`change`);
                        const label = inputNumber.parentElement;
                        const inc = document.createElement(`span`);
                        const dec = document.createElement(`span`);
                        const opt = {
                            step: () => parseFloat(inputNumber.step) || 1,
                            max: () => parseFloat(inputNumber.max),
                            min: () => parseFloat(inputNumber.min),
                            val: () => parseFloat(inputNumber.value),
                            up: () => opt.val() + opt.step(),
                            down: () => opt.val() - opt.step(),
                            setValid: () => label.classList.remove(`TUI_invalid`),
                            setNoValid: () => label.classList.add(`TUI_invalid`),
                            initVal: () => isNaN(opt.val())
                                ? inputNumber.value = (inputNumber.getAttribute(`value`) || opt.min() || opt.max() || 0)
                                : null,
                            setVal(action) {
                                if (inputNumber.hasAttribute(`disabled`) || inputNumber.hasAttribute(`readonly`)) return;
                                opt.initVal();
                                opt.setValid();
                                if (action === `inc`) {
                                    let max = opt.max();
                                    let up = opt.up();
                                    inputNumber.value = isNaN(max) ? up : max > up ? up : max;
                                } else if (action === `dec`) {
                                    let min = opt.min();
                                    let down = opt.down();
                                    inputNumber.value = isNaN(min) ? down : min < down ? down : min;
                                }
                                inputNumber.dispatchEvent(event);
                            }
                        };
                        opt.initVal();
                        inc.classList.add(`TUI_${selfName}-inc`);
                        dec.classList.add(`TUI_${selfName}-dec`);
                        inc.innerHTML = conf.incIcon;
                        dec.innerHTML = conf.decIcon;
                        inputNumber.after(inc);
                        inputNumber.after(dec);
                        inc.addEventListener(`click`, e => {
                            e.preventDefault();
                            opt.setVal(`inc`);
                        });
                        dec.addEventListener(`click`, e => {
                            e.preventDefault();
                            opt.setVal(`dec`);
                        });
                        inputNumber.oninput = () => {
                            let max = opt.max();
                            let min = opt.min();
                            let val = opt.val();
                            opt.setValid();
                            if (isNaN(val)) opt.setNoValid();
                            else if (!isNaN(max) && val > max) inputNumber.value = max;
                            else if (!isNaN(min) && val < min) inputNumber.value = min;
                        };
                        label.title = conf.info;
                        // Пометить элемент как активный
                        _markActivate(inputNumber, selfName);
                    });
                    return collection;
                },

                /**
                 * Деактивация плагина на элементе/тах
                 *
                 * @param {string} selector Селектор элемента/тов
                 * @return {Array} Коллекция элементов
                 */
                kill(selector = defConf.selector) {
                    const collection = [...document.querySelectorAll(selector)]
                        .filter(el => el.tagName === `INPUT` && el.type === `number` && _isActivate(el, selfName));
                    collection.forEach(inputNumber => {
                        if (_isDisabledNode(inputNumber)) return;
                        // Вернуть элемент к состоянию до активации
                        inputNumber.parentElement.querySelectorAll(`span`).forEach(el => el.remove());
                        inputNumber.oninput = null;
                        _unmarkActivate(inputNumber, selfName);
                    });
                    return collection;
                },
            };
            return _is.apply(methods, arguments);
        },

        /**
         * Поиск по списку "select"
         */
        SelectSearch() {
            const selfName = `SelectSearch`;
            const defConf = {
                selector: `.TUI_${selfName}`,
                placeholder: `Поиск по списку`,
            };
            const methods = {

                /**
                 * Активация плагина на элементе/тах
                 *
                 * @param {object} userConf Пользовательская конфигурация
                 * @return {Array} Коллекция из conf.selector
                 */
                init(userConf = {}) {
                    const conf = Object.assign(defConf, userConf);
                    const collection = [...document.querySelectorAll(conf.selector)]
                        .filter(el => el.tagName === `SELECT`);
                    collection.forEach(select => {
                        if (_isDisabledNode(select)) return;
                        // Деактивировать текущий чтобы переписать конфиг
                        if (_isActivate(select, selfName)) methods.kill(conf.selector);
                        // Добавить элементы, классы и прослушку событий
                        let input = document.createElement(`input`);
                        let options = select.querySelectorAll(`option`);
                        let search = () => {
                            if (select.disabled) return;
                            let val = input.value.toLowerCase();
                            options.forEach(option => {
                                option.hidden = !(option.textContent.toLowerCase().indexOf(val) > -1);
                            });
                        };
                        input.classList.add(`TUI_${selfName}-input`);
                        input.type = `text`;
                        input.placeholder = conf.placeholder;
                        input.oninput = search;
                        select.before(input);
                        select.parentElement.addEventListener(`focusout`, e => {
                            if (!e.relatedTarget) {
                                input.value = ``;
                                options.forEach(option => option.hidden = false);
                            }
                        });
                        // Пометить элемент как активный
                        _markActivate(select, selfName);
                    });
                    return collection;
                },

                /**
                 * Деактивация плагина на элементе/тах
                 *
                 * @param {string} selector Селектор элемента/тов
                 * @return {Array} Коллекция элементов
                 */
                kill(selector = defConf.selector) {
                    const collection = [...document.querySelectorAll(selector)]
                        .filter(el => el.tagName === `SELECT` && _isActivate(el, selfName));
                    collection.forEach(select => {
                        if (_isDisabledNode(select)) return;
                        // Вернуть элемент к состоянию до активации
                        const box = select.parentElement;
                        const e = new Event(`focusout`);
                        box.dispatchEvent(e);
                        box.querySelector(`.TUI_${selfName}-input`).remove();
                        _unmarkActivate(select, selfName);
                    });
                    return collection;
                },
            };
            return _is.apply(methods, arguments);
        },

        // /**
        //  * Шаблон плагина TUI
        //  */
        // Plugin() {
        //     const selfName = `Plugin`; // arguments.callee.name
        //     const defConf = {selector: `.myElement`};
        //     const methods = {
        //         init(useConf = {}) {
        //             const conf = Object.assign(defConf, userConf);
        //             const collection = document.querySelectorAll(conf.selector);
        //             collection.forEach(element => {
        //                 if (_isDisabledNode(element)) return;
        //                 if (_isActivate(element, selfName)) methods.kill(conf.selector);
        //
        //                 element.classList.add(`TUI_${selfName}`);
        //                 console.log(`Init TUI.Plugin() on element:`, element);
        //
        //                 _markActivate(element, selfName);
        //             });
        //             return collection
        //         },
        //         kill(selector = defConf.selector) {
        //             const collection = document.querySelectorAll(selector);
        //             collection.forEach(element => {
        //                 if (!_isActivate(element, selfName) || _isDisabledNode(element)) return;
        //
        //                 element.classList.remove(`TUI_${selfName}`);
        //                 console.log(`Kill TUI.Plugin() on element:`, element);
        //
        //                 _unmarkActivate(element, selfName);
        //             });
        //             return collection;
        //         }
        //     };
        //     return _is.apply(methods, arguments);
        // },
    }
})();

/**
 * Автозапуск плагинов TUI
 *
 * Закомментируй или удали вызов
 * неиспользуемых плагинов.
 * Конечно, плагины могут быть вызваны
 * динамически в любом файле с подключенным TUI
 *
 */
document.addEventListener(`DOMContentLoaded`, () => {
    TUI.GoTo();
    TUI.Popup();
    TUI.Tab();
    TUI.Menu();
    TUI.InputFile();
    TUI.InputRange();
    TUI.InputNumber();
    TUI.SelectSearch();
});
