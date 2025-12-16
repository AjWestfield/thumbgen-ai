
const fs = require('fs');
const https = require('https');
const path = require('path');

const urls = [
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F001.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F002.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F003.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F004.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F005.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F006.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F007.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F008.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F009.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F010.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F011.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F012.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F013.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F014.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F015.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F016.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F017.webp&w=384&q=75",
    "https://pikzels.com/_next/image?url=%2Fthumbnails%2F018.webp&w=384&q=75"
];

const downloadImage = (url, index) => {
    const filename = `thumb-${index + 1}.webp`;
    const filePath = path.join(__dirname, 'public/images/marquee', filename);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(filename);
        console.error(`Error downloading ${filename}: ${err.message}`);
    });
};

urls.forEach((url, index) => {
    downloadImage(url, index);
});
