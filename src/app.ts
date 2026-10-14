import dotenv from "dotenv"
dotenv.config()

import chalk from "chalk"
import inquirer from "inquirer"
import fs from "fs"
import path from "path"
const log = console.log

const validateService = (service: string) => {
    if(!service || service.length === 0)
        throw new Error("Service name is required")

    const regex = /^[a-zA-Z0-9-]+$/;
    const isValid = regex.test(service)

    if(!isValid) 
        throw new Error("Space or any symbol is not allowed in service name you can use hyphen -")

    return service.toLowerCase()
}

const exitApp = (msg: string | null = null) => {
    const message = chalk.bgBlue.white.bold(msg || "👋 Good Bye !")
    log(message)
    process.exit(0)
}

const makeFolder = (path: string) => {
    const isExist = fs.existsSync(path)

    if(isExist)
        throw new Error(`${path.split("/").pop()} service already exist !`)

    fs.mkdirSync(path)
}

const copyFiles = (files: string[], inputPath: string, outputPath: string) => {
    files.forEach((file) => {
        fs.copyFileSync(
            path.join(`${inputPath}`, file),
            path.join(`${outputPath}`, file)
        )
    })
}

const createFiles = (files: string[], service: string, srcPath: string) => {
    files.forEach((file) => {
        const fileName = `${service}${file}`
        const filePath = path.join(srcPath, fileName)
        fs.writeFileSync(filePath, "")
    })
}

const updateLastPort = (pipelinePath: string, newPort: number) => {
    const envFilePath = path.join(pipelinePath, ".env")
    const envData = fs.readFileSync(envFilePath, "utf-8")
    const updatedPortString = envData.replace(
        /LAST_PORT\s*=\s*\d+/,
        `LAST_PORT = ${newPort}`
    )
    fs.writeFileSync(envFilePath, updatedPortString)
}

const createEnvForNewService = (pipelinePath: string, servicePath: string, newPort: number) => {
    const pipelineEnvPath = path.join(pipelinePath, ".env")
    const newEnvPath = path.join(servicePath, ".env")
    const envData = fs.readFileSync(pipelineEnvPath, "utf-8")
    const stringChangedAfterPort = envData.replace(
        /PORT\s*=\s*\d+/,
        `PORT = ${newPort}`
    )
    const arr = stringChangedAfterPort.split("\n")
    const modifiedData = arr.map((item) => {
        if(item.startsWith("LAST_PORT"))
            return null
        
        if(item.startsWith("SERVER"))
            return `SERVER = http://localhost:${newPort}\r`
        return item

    }).filter(Boolean)
    const finalData = modifiedData.join("\n")
    fs.writeFileSync(newEnvPath, finalData)
}
 
const app = async () => {
    try {
        const welcomeMessage = chalk.bgMagenta.white.bold(" ---✨✨ Welcome team ! ✨✨---\n")
        log(welcomeMessage)
        const {service} = await inquirer.prompt({
            type: 'input',
            name: 'service',
            message: chalk.yellow("Enter service name || To exit app write :q\n")
        })

        if(service === ":q")
            exitApp()

        if(service === "pipeline")
            exitApp("Pipeline name not allowed")

        const serviceName = validateService(service)
        const dirPath = process.cwd()
        const rootPath = path.dirname(dirPath)
        const pipelinePath = dirPath

        const servicePath = path.join(rootPath, serviceName) 
        const srcPath = path.join(servicePath, "src")
        const appFilePath = path.join(srcPath, "app.ts")

        const filesListForCopy = [
            "Dockerfile",
            "package.json",
            "tsconfig.json",
            ".gitignore"
        ]

        const filesListForCreate = [
            ".model.ts",
            ".controller.ts",
            ".router.ts",
            ".service.ts",
            ".interface.ts",
            ".middleware.ts",
            ".enum.ts",
            ".dto.ts"
        ]

        // Create Service Folder
        makeFolder(servicePath)

        // Create src Folder inside Service Folder
        makeFolder(srcPath)

        // Create app.ts inside src Folder
        fs.writeFileSync(appFilePath, "")

        // Update LAST_PORT in .env File
        const lastPort = parseInt(process.env.LAST_PORT!)
        const newPort = lastPort+1
        updateLastPort(pipelinePath, newPort)
        createEnvForNewService(pipelinePath, servicePath, newPort)

        // copy all required files for typescipt
        copyFiles(filesListForCopy, pipelinePath, servicePath)

        // Create required files for start coding
        createFiles(filesListForCreate, serviceName, srcPath)

        log(chalk.bgGreen.black.bold(`Success - ${serviceName} created successfully\n`))
        exitApp()

    } catch (err) {
        if(err instanceof Error) {
            log(chalk.bgRed.white.bold(`🛑 Error - ${err.message}\n`))
            app()
        }
    }
}
app()