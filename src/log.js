import np from './np';

export default function(title, mes) {
    if (np.log)
        console.log('[' + title + ']:', mes);
}