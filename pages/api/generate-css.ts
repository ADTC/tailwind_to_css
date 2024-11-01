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
    const result = await postcss([
      tailwindcss({
        config: { content: ["./*.none"], corePlugins: { preflight: false } },
      }),
      autoprefixer,
    ])
      .process(css, { from: undefined })
      .then((result) => {
        let css = result.css;

        // Find ".generated" text and extract everything after it.
        const generatedIndex = css.indexOf(".generated");
        if (generatedIndex !== -1) {
          css = css.substring(generatedIndex);
        } else {
          css = "no: result;";
        }

        // Format the CSS
        css = css.replace(/^\s+/gm, "  ");
        css = css.replace(/^\s*\.generated/gm, ".generated");

        return css;
      });

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.toString());
  }
}
