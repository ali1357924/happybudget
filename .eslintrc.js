module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  plugins: ["react", "react-hooks", "prettier", "@typescript-eslint"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  settings: {
    react: {
      /* Tells eslint-plugin-react to automatically detect the version of React
				 to use. */
      version: "detect"
    }
  },
  ignorePatterns: ["*.svg", "node_modules/**/*", "build", "dist", "public"],
  rules: {
    "prettier/prettier": "error",
    "no-global-assign": 2,
    "no-redeclare": "off", // Messes with function overloading.
    "no-restricted-globals": 2,
    quotes: [1, "double"],
    semi: [1, "always"],
    "no-tabs": [
      "error",
      {
        allowIndentationTabs: true
      }
    ],
    "no-unused-expressions": "warn",
    "no-unused-vars": "off",
    "no-multi-spaces": "warn",
    "no-trailing-spaces": "warn",
    "no-console": "off",
    "no-restricted-syntax": [
      "warn",
      {
        selector: "CallExpression[callee.object.name='console'][callee.property.name!=/^(warn|error|info)$/]",
        message: "This property on console is not allowed."
      }
    ],
    "no-eval": "warn",
    "object-curly-spacing": [1, "always"],
    "multiline-comment-style": ["warn", "bare-block"],
    "max-len": [
      "warn",
      {
        code: 120,
        tabWidth: 2,
        comments: 82,
        ignoreRegExpLiterals: true,
        ignorePattern: "^.*(eslint-disable|@ts-ignore).*"
      }
    ],
    "no-shadow": "off",
    /* Note:  These non-typescript base rules have to be disabled as of TS
			 4.0.0 in order to prevent false positives.  The no-undef lint rule does
			 not use TypeScript to determine the global variables that exist -
			 instead, it relies upon ESLint's configuration - so it is strongly
			 recommended that it be turned off since TS will handle it anyways.
			 https://github.com/typescript-eslint/typescript-eslint/blob/master/
			 docs/getting-started/linting/FAQ.md#i-get-errors-from-the-no-undef-
			 rule-about-global-variables-not-being-defined-even-though-there-are-no-
			 typescript-errors */
    "no-use-before-define": "off",
    "no-undef": "off"
  },
  parser: "@typescript-eslint/parser",
  overrides: [
    {
      files: ["*.tsx"],
      extends: ["plugin:react/recommended"],
      parserOptions: {
        project: ["./tsconfig.json"]
      },
      rules: {
        "react/prop-types": ["off"],
        "react/react-in-jsx-scope": ["off"],
        "react/display-name": ["off"],
        "react/no-children-prop": ["off"],
        "react/jsx-curly-brace-presence": ["error", "always"]
      }
    },
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
      ],
      parserOptions: {
        project: ["./tsconfig.json"]
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_"
          }
        ],
        "@typescript-eslint/ban-ts-comment": ["off"],
        "@typescript-eslint/no-shadow": ["error"],
        // Eventually, we want to turn the next 3 rules into warnings.
        "@typescript-eslint/explicit-module-boundary-types": ["off"],
        "@typescript-eslint/explicit-function-return-type": ["off"],
        "@typescript-eslint/no-unsafe-assignment": ["off"],
        /* Eventually, we want this to be an error - but we are getting way too
           many false postives.  It most likely has something to do with the
           order in which files are being loaded. */
        "@typescript-eslint/no-unsafe-call": ["off"],
        /* It would be nice for this to be an error, but unfortunately AG Grid's
			     type bindings are so terrible that it makes it difficult. */
        "@typescript-eslint/no-unsafe-member-access": ["off"]
      }
    }
  ]
};
