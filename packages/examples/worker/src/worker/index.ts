import { channel } from '@vgerbot/channel'
import { CHANNEL_ID } from '../common/consts';
import { UploadFunction } from '../common/UploadFunction';

const c = channel(CHANNEL_ID)
    .connectToMainThread()
    .create();

c.def_method<UploadFunction>(function upload(data, onprogress) {
    let resolve;
    let promise = new Promise(resolve_ => resolve = resolve_)
    let ratio = 0;
    // 模拟文件上传
    let timmerId = setInterval(() => {
        ratio = Math.min(1, ratio + Math.random() / 100);
        if(ratio === 1) {
            resolve();
            clearInterval(timmerId);
        } else {
            onprogress(ratio);
        }
    }, 10);
    return promise;
})
