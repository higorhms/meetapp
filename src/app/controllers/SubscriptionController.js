import * as Yup from 'yup';
import { isBefore } from 'date-fns';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

class SubscriptionController {
    async store(req, res) {
        const schema = Yup.object().shape({
            meetup_id: Yup.number().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        /**
         * Check if the meetup is this user
         */
        const { meetup_id } = req.body;
        const meetup = await Meetup.findByPk(meetup_id);
        if (meetup.user_id === req.userId) {
            return res
                .status(401)
                .json({ error: 'You can not subscribe in your meetups' });
        }

        /**
         * Check if the meetup already done
         */
        if (isBefore(meetup.date, new Date())) {
            return res
                .status(401)
                .json({ error: 'This meetup only have finished' });
        }

        /**
         * Check if user already subscribed
         */
        const alreadySubscribed = await Subscription.findOne({
            where: { meetup_id, user_id: req.userId },
        });

        if (alreadySubscribed) {
            return res
                .status(401)
                .json({ error: 'You are already subscribed' });
        }

        /**
         * Check if hour are disponible
         */
        const ifHourIsAvailable = await Subscription.findOne({
            where: { user_id: req.userId, date: meetup.date },
        });

        if (ifHourIsAvailable) {
            return res.status(401).json({
                error:
                    'You can not subscribe in two meetups with the same hour',
            });
        }

        const subscription = await Subscription.create({
            meetup_id,
            user_id: req.userId,
            date: meetup.date,
        });

        return res.json(subscription);
    }
}

export default new SubscriptionController();
