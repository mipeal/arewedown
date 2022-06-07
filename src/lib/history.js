module.exports = {

    /**
     * Marks a item as passing. returns true if the item status changed since the last status write
     * @param {string} safeName Name of watcher or listener, file-system safe
     * @param {Date} date Date of the event being marked.
     * @param {int} point Point of the event being marked.
     */
    /* Writing a file to the file system. */
    async writePassing(safeName, date, point){
        let settings = require('./settings').get(),
            fs = require('fs-extra'),
            path = require('path'),
            log = require('./../lib/logger').instance(),
            downFlag = path.join(settings.logs, safeName, 'flag'),
            changed = false,
            downDate = null,
            historyLogFolder = path.join(settings.logs, safeName, 'history')
        
        await fs.ensureDir(historyLogFolder)

        await fs.writeJson(path.join(historyLogFolder, `status.json`), {
            status : 'up',
            date,
            point 
        })

        // site is back up after fail was previous detected, clean up flag and write log
        if (await fs.exists(downFlag)){
            try {
                downDate = (await fs.readJson(downFlag)).date
            } catch(ex){
                log.error(`Downflag "${downFlag}" is corrupt`)
            }

            await fs.remove(downFlag)
            
            const event = await this.getLastEvent(safeName)
            if (event.point < point){
                point = parseInt(event.point)
            }
            //test
            console.log("History point: "+point)
            await fs.writeJson(path.join(historyLogFolder, `${date.getTime()}.json`), {
                status : 'up',
                date,
                point
            })

            changed = true
        }

        // if no history exists, write start entry, status flag counts for 1, history will be 1 more
        if ((await fs.readdir(historyLogFolder)).length < 1)
            await fs.writeJson(path.join(historyLogFolder, `${date.getTime()}.json`), {
                status : 'up',
                date,
                point 
            })

        //test point
        console.log("Pass point: "+point)
        return { 
            changed,
            downDate,
            point
        }
    },
    
    /* Reading the last event from the history folder. */
    async getLastEvent(safeName){
        let settings = require('./settings').get(),
            log = require('./../lib/logger').instance(),
            path = require('path'),
            fsUtils = require('madscience-fsUtils'),
            fs = require('fs-extra'),
            historyLogFolder = path.join(settings.logs, safeName, 'history')

        if (!await fs.exists(historyLogFolder))
            return null
        
        let history = await fsUtils.readFilesInDir(historyLogFolder)
        history = history.filter(item => !item.includes('status.json'))
        if (!history.length)
            return null

        try {
            const event = await fs.readJson(history.sort()[history.length - 1])
            return event
        } catch (ex){
            log.error(`Failed to load history for "${safeName}":`, ex)
            return null
        }
    },

    async writeFailing(safeName, date, error){
        const event = await this.getLastEvent(safeName)
        let settings = require('./settings').get(),
            fs = require('fs-extra'),
            path = require('path'),
            downFlag = path.join(settings.logs, safeName, 'flag'),
            changed = false,
            historyLogFolder = path.join(settings.logs, safeName, 'history'),
            point = 100
        
        if (event != null && event.status !== 'up'){
            //test
            console.log("Fail Log point: "+event.point)
            point = parseInt(event.point) - 1
        }
        if(event != null && event.status !== 'down'){
            //test
            console.log("Fail Log point: "+event.point)
            point = parseInt(event.point)
        }
        if (!await fs.exists(downFlag)){
            await fs.ensureDir(historyLogFolder)

            // site is down, write fail flag and log
            await fs.writeJson(downFlag, { date })

            await fs.writeJson(path.join(historyLogFolder, `${date.getTime()}.json`), {
                status : 'down',
                date,
                point,
                error
            })

            await fs.writeJson(path.join(historyLogFolder, `status.json`), {
                status : 'down',
                date : this.lastRun,
                point
            })

            changed = true
        }
        else{
            await fs.ensureDir(historyLogFolder)

            await fs.writeJson(path.join(historyLogFolder, `${date.getTime()}.json`), {
                status : 'down',
                date,
                point,
                error
            })

            await fs.writeJson(path.join(historyLogFolder, `status.json`), {
                status : 'down',
                date : this.lastRun,
                point
            })

            changed = true

        }
        //test point
        console.log("Fail point: "+point)
        return {
            changed,
            point
        }

    }
}
