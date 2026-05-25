import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'x97ym5fy',
    dataset: 'production'
  },
  deployment: {
    appId: 'jf0pq1otnumlbt13jklvdvq9',
    autoUpdates: true,
  }
})
