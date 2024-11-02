import postcss, { type CssSyntaxError } from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { NextApiRequest, NextApiResponse } from "next";
import cssbeautify from "cssbeautify";

interface RequestBody {
  classes: string;
}

const processor = postcss([
  tailwindcss({
    config: { content: ["./*.none"], corePlugins: { preflight: false } },
  }),
  autoprefixer,
]);

const beautifyOptions: Parameters<typeof cssbeautify>[1] = {
  indent: "  ",
  openbrace: "end-of-line",
  autosemicolon: true,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const body: RequestBody = req.body;
  const classes: string[] = body.classes.split(" ");
  const customClasses: string[] = [];
  let doneProcessing = false;

  do {
    try {
      const css = `.generated { @apply ${classes.join(" ")}; }`;

      let result = await processor
        .process(css, { from: undefined })
        .then((result) => result.css);

      if (customClasses.length) {
        const classes = customClasses.join(", .");
        result = `.${classes} {\n  /* Custom classes not found in Tailwind CSS */} ${result}`;
      }

      result = cssbeautify(result, beautifyOptions);

      res.status(200).send(result);
      doneProcessing = true;

      //
    } catch (error) {
      if (error?.name === "CssSyntaxError") {
        const cssError = error as CssSyntaxError;
        const customClass = cssError.reason.match(
          /`([^`]+)` class does not exist/
        )?.[1];

        if (customClass) {
          customClasses.push(customClass);
          classes.splice(classes.indexOf(customClass), 1);

          //
        } else {
          res.status(500).send(error.toString());
          doneProcessing = true;
        }

        //
      } else {
        res.status(500).send(error.toString());
        doneProcessing = true;
      }
    }
  } while (!doneProcessing);
}
