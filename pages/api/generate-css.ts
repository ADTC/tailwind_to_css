import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { NextApiRequest, NextApiResponse } from "next";

interface RequestBody {
  classes: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { classes }: RequestBody = req.body;

  const css = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    .generated {
      @apply ${classes};
    }
  `;

  try {
    const result = await postcss([tailwindcss, autoprefixer])
      .process(css, { from: undefined })
      .then((result) => {
        let css = result.css;
        // Extract the part between ".generated {" and nearest "}" over multiple lines
        const generatedClasses = css.match(/\.generated \{([^}]*)\}/s);
        if (generatedClasses) {
          css = generatedClasses[1];
          // Trim all lines to remove extra spaces in beginning but keep new lines
          css = css.replace(/^[ \t]+/gm, "");
        } else {
          css = "no: result;";
        }
        return css;
      });

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.toString());
  }
}
