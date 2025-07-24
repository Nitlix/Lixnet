export default function ({
    error = false,
    message,
}: {
    error?: boolean;
    message: string;
}) {
    if (error) {
        return console.error(`[LIXNET]`, message);
    }
    return console.log(`[LIXNET]`, message);
}
