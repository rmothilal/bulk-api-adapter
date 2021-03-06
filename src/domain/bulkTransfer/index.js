/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Georgi Georgiev <georgi.georgiev@modusbox.com>
 --------------
 ******/
'use strict'

const Logger = require('@mojaloop/central-services-shared').Logger
const Uuid = require('uuid4')
const Utility = require('../../lib/utility')
const Kafka = require('../../lib/kafka')

const PREPARE = 'prepare'
const FULFIL = 'fulfil'
const BULK_TRANSFER = 'bulk'

/**
 * @module src/domain/bulkTransfer
 */

/**
* @function bulkPrepare
* @async
* @description This will produce a transfer bulkPrepare message to transfer bulkPrepare kafka topic. It gets the kafka configuration from config. It constructs the message and published to kafka
*
* @param {object} headers - the http header from the request
* @param {object} message - the transfer bulkPrepare message
*
* @returns {boolean} Returns true on successful publishing of message to kafka, throws error on falires
*/
const bulkPrepare = async (messageId, headers, message) => {
  Logger.debug('domain::bulk-transfer::prepare::start(%s, %s)', headers, message)
  try {
    let { payerFsp, payeeFsp } = message
    const messageProtocol = {
      id: messageId,
      to: payeeFsp,
      from: payerFsp,
      type: 'application/json',
      content: {
        headers,
        payload: message
      },
      metadata: {
        event: {
          id: Uuid(),
          type: 'bulk-prepare',
          action: 'bulk-prepare',
          createdAt: new Date(),
          state: {
            status: 'success',
            code: 0
          }
        }
      }
    }
    const topicConfig = Utility.createGeneralTopicConf(BULK_TRANSFER, PREPARE)
    const kafkaConfig = Utility.getKafkaConfig(Utility.ENUMS.PRODUCER, BULK_TRANSFER.toUpperCase(), PREPARE.toUpperCase())
    Logger.debug(`domain::bulkTransfer::prepare::messageProtocol - ${messageProtocol}`)
    Logger.debug(`domain::bulkTransfer::prepare::topicConfig - ${topicConfig}`)
    Logger.debug(`domain::bulkTransfer::prepare::kafkaConfig - ${kafkaConfig}`)
    await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)
    return true
  } catch (err) {
    Logger.error(`domain::bulkTransfer::prepare::Kafka error:: ERROR:'${err}'`)
    throw err
  }
}

const bulkFulfil = async (messageId, headers, message) => {
  Logger.debug('domain::bulk-transfer::fulfil::start(%s, %s)', headers, message)
  try {
    const messageProtocol = {
      id: messageId,
      to: headers['fspiop-destination'],
      from: headers['fspiop-source'],
      type: 'application/json',
      content: {
        uriParams: { id: message.bulkTransferId },
        headers: headers,
        payload: message
      },
      metadata: {
        event: {
          id: Uuid(),
          type: 'bulk-fulfil',
          action: 'bulk-commit',
          createdAt: new Date(),
          state: {
            status: 'success',
            code: 0
          }
        }
      }
    }
    const topicConfig = Utility.createGeneralTopicConf(BULK_TRANSFER, FULFIL)
    const kafkaConfig = Utility.getKafkaConfig(Utility.ENUMS.PRODUCER, BULK_TRANSFER.toUpperCase(), FULFIL.toUpperCase())
    Logger.debug(`domain::bulkTransfer::fulfil::messageProtocol - ${messageProtocol}`)
    Logger.debug(`domain::bulkTransfer::fulfil::topicConfig - ${topicConfig}`)
    Logger.debug(`domain::bulkTransfer::fulfil::kafkaConfig - ${kafkaConfig}`)
    await Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig)
    return true
  } catch (err) {
    Logger.error(`domain::bulkTransfer::fulfil::Kafka error:: ERROR:'${err}'`)
    throw err
  }
}

module.exports = {
  bulkPrepare,
  bulkFulfil
}
