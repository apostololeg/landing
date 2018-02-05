const ORIENTATION_CHANGE_TIMEOUT = 300
let windowResizeHandlers = []

window.onresize = () => windowResizeHandlers.forEach(fn => fn())

export const isLandscape = () => Number.isFinite(window.orientation)
    ? window.orientation !== 0
    : window.innerHeight < window.innerWidth

export const getDeviceOrientation = () => {
    return isLandscape() ? 'landscape' : 'portrait'
}

export const onWindowResize = fn => {
    if (windowResizeHandlers.indexOf(fn) === -1) {
        windowResizeHandlers.push(fn)
    }
}

export const unWindowResize = fn => {
    const index = windowResizeHandlers.indexOf(fn)

    if (index === -1) {
        return
    }

    windowResizeHandlers = [
        ...windowResizeHandlers.slice(0, index),
        ...windowResizeHandlers.slice(index + 1),
    ]
}

const bindOrientation = cb => {
    window.addEventListener('resize', cb, false)
    window.addEventListener('orientationchange', cb, false)
}

export const onOrientationChange = cb => {
    bindOrientation(() => {
        let orientation = getDeviceOrientation()

        cb(orientation)
        // http://stackoverflow.com/a/6603537
        setTimeout(() => {
            let newOrientation = getDeviceOrientation()

            if (newOrientation !== orientation) {
                orientation = newOrientation
                cb(newOrientation)
            }
        }, ORIENTATION_CHANGE_TIMEOUT)
    })
}

export const unOrientationChange = cb => {
    window.removeEventListener('resize', cb, false)
    window.removeEventListener('orientationchange', cb, false)
}
