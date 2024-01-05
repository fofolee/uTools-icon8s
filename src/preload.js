const fs = require('fs');
const https = require("https");
const Mousetrap = require('mousetrap');
const Nanobar = require('nanobar')
const png2icons = require("png2icons");
const folderico = require('./folderico')
const os = require('os')
const path = require('path')

const icons8 = {}

const styleGroups = {
    colored: 'office16,office30,office40,office80,color,fluent,nolan,3d-fluency,isometric,emoji,dusk,stickers,plasticine,bubbles,cotton,clouds,doodle,arcade,pulsar-color,clr-gls,ultraviolet,flat_round,parakeet,neon,matisse,tiny-color,stencil,avantgarde,water-color,retro,3d-plastilina,stitch',
    ui: 'ios11,ios_filled,ios7,androidL,m_outlined,m_rounded,m_sharp,m_two_tone,fluent,fluent-systems-filled,fluent-systems-regular,win8,win10,sf-ultralight,sf-ultralight-filled,sf-regular,sf-black-filled,sf-black,sf-regular-filled,office16,office30,office40,office80,tiny-glyph,tiny-color,puffy,puffy-filled,color,3d-fluency,emoji,glyph-neue,p1em,ultraviolet,android',
    outlined: 'fluent-systems-regular,win10,sf-ultralight,sf-regular,sf-black,ios7,m_outlined,dotty,Dusk_Wired,isometric-line,pastel_glyph,carbon_copy,pulsar-line,puffy,parakeet-line,badges,quill,laces,neon,hatch,water-color,pixels',
    filled: 'ios_filled,ios11,androidL,m_rounded,m_sharp,fluent-systems-filled,win8,sf-ultralight-filled,sf-regular-filled,sf-black-filled,glyph-neue,puffy-filled,tiny-glyph,android',
    _3d: 'isometric,isometric-line,3d-fluency,3d-plastilina',
    handDrawn: 'doodle,quill,laces,matisse',
    all: 'all'
}

// 更新数据库
const pushData = (databases, data) => {
    var db = utools.db.get(databases);
    if (db) {
        utools.db.put({ _id: databases, data: data, _rev: db._rev });
    } else {
        utools.db.put({ _id: databases, data: data });
    }
}

// get请求
const get = url =>
    new Promise((resolve, reject) => {
        var listnum = document.querySelectorAll('.list-item').length;
        if (!listnum) utools.setExpendHeight(1);
        try {
            document.querySelector('.nanobar').remove();
        } catch (e) {
        }
        var nanobar = new Nanobar();
        document.getElementById('nanobarcss').innerHTML = `
        .nanobar {
            width:100%;
            height:1px;
            z-index:99999;
            top:0
        }
        .bar {
            width:0;
            height:100%;
            transition:height .3s;
            background-image: linear-gradient(to top, #37ecba 0%, #72afd3 100%)
        }`
        var bar = 10;
        nanobar.go(bar);
        https.get(url, (res) => {
            var chunks = [];
            res.on('data', (chunk) => {
                bar += 20;
                nanobar.go(bar)
                chunks.push(chunk);
            });
            res.on("end", () => {
                nanobar.go(100)
                resolve(Buffer.concat(chunks))
            }).on('error', (e) => {
                reject(res.statusMessage);
            });
        })
    })

// 获取指定size图片，返回buffer
const getImgBuffer = async size => {
    var src = document.querySelector('.list-item-selected img').src;
    var icon = await get(src.replace('/2x/', `/${size}/`));
    return icon
}

// 复制图片到剪贴板
const copyPng = async size => {
    var icon = await getImgBuffer(size);
    utools.copyImage(icon);
    utools.showNotification('已复制');
}

// 保存png
const savePng = async size => {
    var icon = await getImgBuffer(size);
    var name = document.querySelector('.list-item-selected .list-item-title').innerText
    options = {
        title: '选择保存位置',
        defaultPath: name + '.png',
    };
    saveImg(options, icon, 'binary');
}

// 保存svg
const saveSvg = async () => {
    var id = document.querySelector('.list-item-selected .list-item-description').innerText.split(',')[0].split(':')[1].trim();
    var url = `https://api-icons.icons8.com/siteApi/icons/icon?id=${id}`;
    var data = await get(url);
    console.log(data);
    var svg = JSON.parse(data).icon.svg;
    var name = document.querySelector('.list-item-selected .list-item-title').innerText
    options = {
        title: '选择保存位置',
        defaultPath: name + '.svg',
    };
    saveImg(options, svg, 'base64');
}

// 保存ico
const saveIco = async size => {
    var icon = await getImgBuffer(size);
    var ico = png2icons.createICO(icon, png2icons.BICUBIC, 0, false);
    var name = document.querySelector('.list-item-selected .list-item-title').innerText
    options = {
        title: '选择保存位置',
        defaultPath: name + '.ico',
    };
    saveImg(options, ico, 'binary');
}

// 保存icns
const saveIcns = async size => {
    var icon = await getImgBuffer(size);
    var icns = png2icons.createICNS(icon, png2icons.BILINEAR, 0);
    var name = document.querySelector('.list-item-selected .list-item-title').innerText
    options = {
        title: '选择保存位置',
        defaultPath: name + '.icns',
    };
    saveImg(options, icns, 'binary');
}

const setFolderIcon = async (size) => {
    var icon = await getImgBuffer(size);
    var folderPath = utools.showOpenDialog({
        properties: ['openDirectory'],
        title: '选择文件夹'
    })
    if (!folderPath) return
    if (process.platform == 'darwin') {
        var icns = png2icons.createICNS(icon, png2icons.BILINEAR, 0);
        var iconPath = path.join(os.tmpdir(), 'icon.icns');
        fs.writeFileSync(iconPath, icns, 'binary')
        folderico.changeMacFolderIcon(folderPath, iconPath)
    } else {
        var ico = png2icons.createICO(icon, png2icons.BICUBIC, 0, false);
        var iconPath = path.join(os.tmpdir(), 'icon.ico');
        fs.writeFileSync(iconPath, ico, 'binary')
        folderico.changeWinowsFolderIcon(folderPath, iconPath)
    }
}

// 以指定编码保存图片
const saveImg = (options, content, coding) => {
    var filename = utools.showSaveDialog(options)
    filename && fs.writeFile(filename, content, coding, err => {
        err && console.log(err)
    })
}

// 偏好设置
const showPreferences = async () => {
    var language, platform, amount, style;
    if (!icons8.preferences) {
        // language = "en-US";
        style = "colored";
        amount = "300";
        token = ""
    } else {
        // language = icons8.preferences.language;
        size = icons8.preferences.size;
        amount = icons8.preferences.amount;
        token = icons8.preferences.token || "";
        style = icons8.preferences.style || "colored"
    }
    utools.setExpendHeight(480)
    utools.subInputBlur();
    await require('sweetalert2').fire({
        title: '设置',
        onBeforeOpen: () => {
            // document.getElementById('language').value = language;
            document.getElementById('style').value = style;
        },
        backdrop: '#bbb',
        html:
            `<!--搜索语言 <select id="language"class="swal2-select" style="width: 80%; height: 3rem; text-align: center; text-align-last: center">
            <option value="en-US">英文</>
            <option value="zh-CN">中文</>
        </select>-->
        图标风格 <select id="style" class="swal2-select" style="width: 80%; height: 3rem; text-align: center; text-align-last: center"> <option value="all">全部</> <option value="colored">彩色</><option value="ui">UI</><option value="outlined">线条</><option value="filled">填充</><option value="_3d">3D</><option value="handDrawn">手绘</> </select>
        搜索数量 <input value="${amount}" placeholder="搜索图标的最大数量" id="amount" class="swal2-input" style="width: 80%; height: 3rem; text-align: center">
        APIKEY <input value="${token}" placeholder="APIKEY" id="token" class="swal2-input" style="width: 80%; height: 3rem; text-align: center">`,
        focusConfirm: false,
        confirmButtonText: '保存',
        preConfirm: () => {
            var data = {
                // language: document.getElementById('language').value,
                style: document.getElementById('style').value,
                amount: document.getElementById('amount').value,
                token: document.getElementById('token').value
            }
            icons8.preferences = data;
            pushData("icons8Preferences", data);
        },
        footer: '图标搜索来自<a href="#" onclick=utools.shellOpenExternal("https://icons8.com/")>icon8s</a>, 如搜索失效,<a href="#" onclick=utools.shellOpenExternal("https://developers.icons8.com/")>此处</a>申请 APIKEY'
    })
    var listnum = document.querySelectorAll('.list-item').length;
    utools.setExpendHeight(listnum > 10 ? 480 : 48 * listnum);
    utools.subInputFocus();
}

// 更多
const showMoreFeatures = async () => {
    utools.setExpendHeight(480)
    utools.subInputBlur();
    const swal = require('sweetalert2')
    await swal.fire({
        backdrop: '#bbb',
        html:
            `选择图标尺寸 <select id="size" class="swal2-select" style="width: 80%; height: 3rem; margin: 5px; text-align: center; text-align-last: center"> <option value="1x">1x</> <option value="2x">2x</> <option value="3x">3x</> <option value="4x">4x</> <option value="5x">5x</> <option value="6x">6x</> <option value="7x">7x</> <option value="8x">8x</> <option value="9x">9x</> <option value="10x">10x</> <option value="11x">11x</> <option value="12x">12x</> </select>
        <button id="png" class="swal2-confirm swal2-styled" style="width: 80%; height: 3rem; margin: 5px">下载 PNG</button>
        <button id="svg" class="swal2-confirm swal2-styled" style="width: 80%; height: 3rem; margin: 5px">下载 SVG</button>
        <button id="ico" class="swal2-confirm swal2-styled" style="width: 80%; height: 3rem; margin: 5px">转为 ICO</button>
        <button id="icns" class="swal2-confirm swal2-styled" style="width: 80%; height: 3rem; margin: 5px">转为 ICNS</button>
        <button id="clip" class="swal2-confirm swal2-styled"  style="width: 80%; height: 3rem; margin: 5px">复制至剪贴板</button>
        <button button id = "folder" class= "swal2-confirm swal2-styled"  style = "width: 80%; height: 3rem; margin: 5px" > 设为文件夹图标</button >`,
        showConfirmButton: false,
        onBeforeOpen: () => {
            document.getElementById('png').onclick = () => {
                var size = document.getElementById('size').value
                swal.clickConfirm()
                savePng(size);
            }
            document.getElementById('clip').onclick = () => {
                var size = document.getElementById('size').value
                swal.clickConfirm()
                copyPng(size);
            }
            document.getElementById('svg').onclick = () => {
                swal.clickConfirm()
                saveSvg();
            }
            document.getElementById('ico').onclick = () => {
                var size = document.getElementById('size').value
                swal.clickConfirm()
                saveIco(size);
            }
            document.getElementById('icns').onclick = () => {
                var size = document.getElementById('size').value
                swal.clickConfirm()
                saveIcns(size);
            }
            document.getElementById('folder').onclick = () => {
                var size = document.getElementById('size').value
                swal.clickConfirm()
                setFolderIcon(size);
            }
        },
    })
    var listnum = document.querySelectorAll('.list-item').length;
    utools.setExpendHeight(listnum > 10 ? 480 : 48 * listnum);
    utools.subInputFocus();
}

// 搜索
const search = async searchWord => {
    var amount = icons8.preferences.amount;
    var style = icons8.preferences.style;
    var token = icons8.preferences.token;
    var language = /[\u4e00-\u9fa5]/.test(searchWord) ? 'zh' : 'en';
    var url = `https://search.icons8.com/api/iconsets/v5/search?term=${encodeURIComponent(searchWord)}&amount=${amount}&offset=0&platform=${styleGroups[style]}&language=${language}`;
    if (token) url += `&token=${token}`
    var data = await get(url);
    var icons = JSON.parse(data).icons
    for (var i of icons) {
        i.title = i.name;
        i.description = `id: ${i.id}, 风格: ${i.platform}, 分类: ${i.category}`
        i.icon = `https://img.icons8.com/${i.platform}/2x/${i.commonName}.png`
    }
    return icons
}

// 列表模式
window.exports = {
    "icons8": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                try {
                    icons8.preferences = utools.db.get("icons8Preferences").data;
                    if (!icons8.preferences.style) icons8.preferences.style = 'colored'
                } catch (error) {
                    showPreferences()
                }
                if (document.querySelector('.swal2-shown')) utools.setExpendHeight(480);
            },
            search: (action, searchWord, callbackSetList) => {
                Mousetrap.bind('enter', async () => {
                    var icons = await search(searchWord);
                    callbackSetList(icons)
                    utools.setSubInputValue('')
                    return false
                });
            },
            // select: async (action, itemData, callbackSetList) => {
            // },
            placeholder: "回车搜索， ctrl+s → 快速保存， ctrl+i → 偏好设置， ctrl+e → 保存为更多格式"
        }
    }
}

// 快速保存图片
Mousetrap.bind('ctrl+s', () => {
    savePng('2x');
    return false
});

// 更多保存格式
Mousetrap.bind('ctrl+e', async () => {
    showMoreFeatures()
    return false
})

// 偏好设置
Mousetrap.bind('ctrl+i', () => {
    showPreferences()
    return false
});
