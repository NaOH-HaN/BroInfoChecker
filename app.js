// 浏览器信息检测功能
const Detector = {
    // 基本信息检测
    basicInfo: () => ({
        'User Agent': navigator.userAgent,
        '平台': navigator.platform,
        '语言': navigator.language,
        'Cookies 启用': navigator.cookieEnabled ? '是' : '否',
        '在线状态': navigator.onLine ? '在线' : '离线',
        '设备内存': navigator.deviceMemory || '未知',
        'CPU 核心数': navigator.hardwareConcurrency || '未知'
    }),

    // 功能检测
    features: () => ({
        '地理定位': 'geolocation' in navigator,
        '本地存储': 'localStorage' in window,
        'Service Workers': 'serviceWorker' in navigator,
        '推送通知': 'PushManager' in window,
        'WebGL': !!window.WebGLRenderingContext,
        'Web Audio': !!window.AudioContext,
        '触摸事件': 'ontouchstart' in window
    }),

    // 权限检测
    permissions: async () => {
        const permissions = {
            '摄像头': {name: 'camera'},
            '麦克风': {name: 'microphone'},
            '地理位置': {name: 'geolocation'},
            '通知': {name: 'notifications'}
        };
        
        const results = {};
        for (const [name, permission] of Object.entries(permissions)) {
            try {
                const status = await navigator.permissions.query(permission);
                results[name] = status.state;
            } catch {
                results[name] = '不支持';
            }
        }
        return results;
    },

    // 隐私相关检测
    privacy: async () => ({
        '请勿跟踪': navigator.doNotTrack || window.doNotTrack === "1" ? '已启用' : '未启用',
        '第三方 Cookie': await detectThirdPartyCookies(),
        '广告拦截': await detectAdBlock()
    }),

    // WebRTC 检测
    webrtc: async () => ({
        'WebRTC 支持': !!window.RTCPeerConnection,
        '本地 IP': await getLocalIP()
    })
};

// 工具函数
const Utils = {
    populateData: (containerId, data) => {
        const container = document.getElementById(containerId);
        container.innerHTML = Object.entries(data)
            .map(([key, value]) => `
                <div class="info-item">
                    <span class="info-key">${key}</span>
                    <span class="info-value ${typeof value === 'boolean' ? (value ? 'yes' : 'no') : ''}">
                        ${Utils.formatValue(value)}
                    </span>
                </div>
            `).join('');
    },

    formatValue: value => {
        if (typeof value === 'boolean') return value ? '支持' : '不支持';
        return value;
    },

    getLocalIP: () => new Promise(resolve => {
        const pc = new RTCPeerConnection({iceServers: []});
        pc.createDataChannel('');
        pc.createOffer().then(sdp => pc.setLocalDescription(sdp));
        pc.onicecandidate = ice => {
            if (!ice.candidate) return;
            const ip = ice.candidate.candidate.split(' ')[4];
            resolve(ip || '未检测到');
            pc.close();
        };
    }),

    detectThirdPartyCookies: async () => {
        try {
            await navigator.cookieEnabled;
            return document.cookie.includes('test=123') ? '允许' : '阻止';
        } catch {
            return '未知';
        }
    },

    detectAdBlock: () => new Promise(resolve => {
        const ad = document.createElement('div');
        ad.innerHTML = '&nbsp;';
        ad.className = 'ad-unit';
        document.body.appendChild(ad);
        setTimeout(() => {
            resolve(ad.offsetHeight === 0);
            document.body.removeChild(ad);
        }, 100);
    })
};

// 初始化检测
document.addEventListener('DOMContentLoaded', async () => {
    Utils.populateData('basic-info', Detector.basicInfo());
    Utils.populateData('feature-detection', Detector.features());
    Utils.populateData('permission-status', await Detector.permissions());
    Utils.populateData('privacy-status', await Detector.privacy());
    Utils.populateData('webrtc-info', await Detector.webrtc());
});