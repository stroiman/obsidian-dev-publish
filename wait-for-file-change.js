const fs = require("fs");

fs.watch(".", { recursive: true }, () => {
	process.exit(0);
});
