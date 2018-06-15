var compo_name = '';
var compo_options = '';
var compo_create = function(name, options) {
    Vue.component(name, options)
};
compo_name = 'ajax-btn';
compo_options = {
    props: {
        text: {
            type: String
        },
        text_success: {
            type: String
        },
        text_fail: {
            type: String
        },
        type: {
            type: String,
            default: 'default'
        },
        url: {
            type: String
        },
        response_type: {
            type: String,
            default: ""
        },
        method: {
            type: String,
            required: false,
            default: 'GET'
        },
        headers: {
            type: Object,
            required: false,
            default: function() { return {} }
        },
        body: {
            type: Object,
            required: false,
            default: function() { return {} }
        },
        json: {
            type: Boolean,
            default: true
        },
        value: {},
        validate: {
            type: Function,
            default: function() {
                return true;
            }
        },
        validation: {
            type: Boolean,
            default: true
        },
        bes_ajax: {
            type: Object
        },
        fetch_options: {
            type: Object,
            default: function() {
                return {}
            }
        },
        options: {
            type: Object,
            default: function() {
                return {}
            }
        }
    },
    data: function() {
        return {
            status: 'ready'
        }
    },
    methods: {
        send: function() {
            if (this.status === 'ready' || (this.status !== 'pending' && this.type !== 'once')) {
                if (!this.validate())
                    return;
                if (!this.validation)
                    return;
                this.status = 'pending'
                //1.use besAjax Class (fetch)
                if (this.bes_ajax) {
                    var com = this;
                    var promise = this.bes_ajax['extend'](this.fetch_options, this.options).send().then(function(res) {
                        com.status = 'success'
                        com.$emit('input', res)
                        return Promise.resolve(res)
                    }).catch(function(e) {
                        com.status = 'fail'
                        return Promise.reject(e)
                    })
                    this.$emit('send', promise)
                    return;
                }
                //2.use normal xhr
                var xhr = new XMLHttpRequest();
                var post_body = '';
                xhr.open(this.method, this.url);
                for (i in this.headers) {
                    xhr.setRequestHeader(i, this.headers[i])
                }
                if (this.json) {
                    xhr.setRequestHeader('Content-type', 'application/json');
                    post_body = JSON.stringify(this.body);
                } else {
                    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
                    for (i in this.body) {
                        if (post_body !== '')
                            post_body += '&';
                        post_body += i + '=' + this.body[i]
                    }
                }
                xhr.responseType = this.response_type;
                xhr.send(post_body)
                var com = this;
                xhr.onreadystatechange = function() {
                    if (this.readyState === 4 && this.status === 200) {
                        com.status = 'success'
                        com.$emit('input', this.responseText)
                        com.$emit('end', this.responseText)
                    } else if (this.readyState === 4) {
                        com.status = 'fail'
                        com.$emit('end', this.status)
                    }
                }
            }
        }
    }
}
var ajaxBtn = Vue.extend(compo_options);

compo_create(compo_name, ajaxBtn.extend({
    template: '<div class="ajax-btn" :class="\'ajax-btn-\'+status" v-on:click="send">\
    <div v-if="status===\'ready\'">{{text}}</div>\
    <div v-else-if="status===\'pending\'" class="pending"><div class="loading"></div></div>\
    <div v-else-if="status===\'success\'">{{(text_success)?text_success:text}}</div>\
    <div v-else-if="status===\'fail\'">{{(text_fail)?text_fail:text}}</div>\
    </div>'
}))

compo_name = 'ajax-btn-custom'
compo_create(compo_name, ajaxBtn.extend({
    template: '<div class="ajax-btn" :class="\'ajax-btn-\'+status" v-on:click="send">\
    <div v-if="status===\'ready\'"><slot name="ready"></slot></div>\
    <div v-else-if="status===\'pending\'"><slot name="pending"></slot></div>\
    <div v-else-if="status===\'success\'"><slot name="success"></slot></div>\
    <div v-else-if="status===\'fail\'"><slot name="fail"></slot></div>\
    </div>'
}))

compo_name = 'on-off-btn';
compo_options = {
    props: {
        text_on: {
            type: String,
            default: 'on'
        },
        text_off: {
            type: String,
            default: 'off'
        },
        value: {
            type: Boolean
        }
    },
    data: function() {
        return {}
    },
    methods: {
        truning: function() {
            this.$emit('input', !this.value)
        }
    }
}
var onOffBtn = Vue.extend(compo_options)
compo_create(compo_name, compo_options)
compo_create(compo_name, onOffBtn.extend({
    template: '<div v-on:click="truning" class="on-off-btn" :class="(value)?\'on-off-btn-on\':\'on-off-btn-off\'">\
        <div class="wrap-over"><div class="wrap"><div class="on">{{text_on}}</div><div class="bar"></div>\
        <div class="off">{{text_off}}</div></div></div>\
        </div>'
}))

compo_name = 'radio-group';
compo_options = {
    template: '<div class="radio-group">\
    <div class="radio" v-for="r in radios">\
    <input type="radio" v-model="selected" v-on:change="changing" :value="r"><span>{{r}}</span>\
    </div></div>',
    props: {
        radios: {
            type: Array
        },
        value: {}
    },
    data: function() {
        return {
            selected: this.value
        }
    },
    methods: {
        changing: function() {
            this.$emit('input', this.selected)
        }
    }
}
compo_create(compo_name, compo_options)

compo_name = 'drop-menu';
compo_options = {
    template: '<select class="drop-menu" v-on:change="changing" v-model="selected">\
    <option v-for="op in options" :value="op">{{op}}</option></select>',
    props: {
        options: {
            type: Array
        },
        value: {}
    },
    data: function() {
        return {
            selected: this.value
        }
    },
    methods: {
        changing: function() {
            this.$emit('input', this.selected)
        }
    }
}
compo_create(compo_name, compo_options)

compo_name = 'popup-alert';
compo_options = {
    props: {
        value: {
            type: Boolean,
            default: false
        },
        message: {
            type: String
        },
        text_confirm: {
            type: String,
            default: 'confirm'
        }
    },
    data: function() {
        return {}
    },
    methods: {
        confirm: function() {
            this.$emit('input', false)
        }
    }
}
var popupAlert = Vue.extend(compo_options)
compo_create(compo_name, popupAlert.extend({
    template: '<div class="popup popup-alert" v-if="value"><div class="content">\
        <div class="message">{{message}}</div>\
        <button class="confirm" v-on:click="confirm">{{text_confirm}}</button>\
    </div></div>'
}))
compo_name = 'popup-alert-custom';
compo_create(compo_name, popupAlert.extend({
    template: '<div class="popup popup-alert" v-if="value"><div class="content">\
        <slot></slot>\
        <button class="confirm" v-on:click="confirm">{{text_confirm}}</button>\
    </div></div>'
}))

compo_name = 'popup-confirm';
var popupConfirm = popupAlert.extend({
    props: {
        text_confirm: {
            type: String,
            default: 'OK'
        },
        text_cancel: {
            type: String,
            default: 'NO'
        },
        validate: {
            type: Function,
            default: function() {
                return true
            }
        },
        validation: {
            type: Boolean,
            default: true
        }
    },
    methods: {
        confirm: function(com) {
            if (com) {
                if (!this.validation)
                    return;
                if (!this.validate())
                    return
                this.$emit('confirm')
            } else
                this.$emit('cancel')
            this.$emit('input', false)
        }
    }
})
compo_create(compo_name, popupConfirm.extend({
    template: '<div class="popup popup-confirm" v-if="value"><div class="content">\
        <div class="message">{{message}}</div>\
        <button class="confirm" v-on:click="confirm(true)">{{text_confirm}}</button>\
        <button class="cancel" v-on:click="confirm(false)">{{text_cancel}}</button>\
    </div></div>'
}))
compo_name = 'popup-confirm-custom';
compo_create(compo_name, popupConfirm.extend({
    template: '<div class="popup popup-confirm" v-if="value"><div class="content">\
        <slot></slot>\
        <button class="confirm" v-on:click="confirm(true)">{{text_confirm}}</button>\
        <button class="cancel" v-on:click="confirm(false)">{{text_cancel}}</button>\
    </div></div>'
}))

compo_name = 'popup-prompt';
var popupPrompt = popupConfirm.extend({
    data: function() {
        return {
            input: ''
        }
    },
    methods: {
        confirm: function(com) {
            if (com)
                this.$emit('confirm', this.input)
            else
                this.$emit('cancel', this.input)
            this.$emit('input', false)
        }
    }
})
compo_create(compo_name, popupPrompt.extend({
    template: '<div class="popup popup-prompt" v-if="value"><div class="content">\
        <div class="message">{{message}}</div>\
        <input v-model="input">\
        <button class="confirm" v-on:click="confirm(true)">{{text_confirm}}</button>\
        <button class="cancel" v-on:click="confirm(false)">{{text_cancel}}</button>\
    </div></div>'
}))
compo_name = 'popup-prompt-passward';
compo_create(compo_name, popupPrompt.extend({
    template: '<div class="popup popup-prompt-passward" v-if="value"><div class="content">\
        <div class="message">{{message}}</div>\
        <input v-model="input">\
        <input>\
        <button class="confirm" v-on:click="confirm(true)">{{text_confirm}}</button>\
        <button class="cancel" v-on:click="confirm(false)">{{text_cancel}}</button>\
    </div></div>'
}))

compo_name = 'message-bar';
compo_options = {
    template: '<div class="message-bar"><div class="mes" v-for="mes in message" :class="(mes.type)?mes.type:\'normal\'">{{mes.message}}</div></div>',
    data: function() {
        return {
            length: 0,
            timer:null,
        }
    },
    props: {
        value: {},
        max: {
            type: Number,
            default: 5
        },
        time:{
            type: Number,
            default: 1000
        }
    },
    computed: {
        message: function() {
            var value = this.value;
            var me = this;
            if(value.length> this.max){
                value.pop()
            }
            if (value.length > 0) {
                if (this.timer)
                    clearTimeout(this.timer);
                this.timer = setTimeout(function() {
                    value.pop()
                }, this.time)
            }
            return value;
        }
    }
}
compo_create(compo_name, compo_options)
// compo_name = 'mult-tab';
// compo_options = {
//     template : '<div class="mult-tab">\
//         <div class="tab-group">\
//             <div class="tab">中文</div><div class="tab">English</div><div class="tab">English</div>\
//         </div>\
//         <div class="context">12323123asdsdasdasdasd</div></div>',
//     data: function(){
//         return {}
//     }
// }
// compo_create(compo_name,compo_options)