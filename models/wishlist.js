module.exports = (sequelize, DataTypes) => {

    const Wishlist =
        sequelize.define(
            'Wishlist',
            {

                id: {
                    type: DataTypes.BIGINT,
                    autoIncrement: true,
                    primaryKey: true
                },

                customer_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },

                branch_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },

                status: {
                    type: DataTypes.INTEGER,
                    defaultValue: 1
                },

                del_status: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0
                }

            },
            {

                tableName:
                    'wishlists',

                timestamps: true,

                createdAt:
                    'created_at',

                updatedAt:
                    'updated_at'

            }
        );

    Wishlist.associate = (models) => {

        Wishlist.belongsTo(
            models.Customer,
            {
                foreignKey:
                    'customer_id'
            }
        );

        Wishlist.belongsTo(
            models.Branch,
            {
                foreignKey:
                    'branch_id'
            }
        );

    };

    return Wishlist;

};