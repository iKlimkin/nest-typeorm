module.exports = {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "../src/features",
  "testEnvironment": "node",
  "testRegex": "\\.use-case\\.test\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "testTimeout": 10000
}
