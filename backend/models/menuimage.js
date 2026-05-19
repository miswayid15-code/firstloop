module.exports = (sequelize, DataTypes) => {

    const MenuImage = sequelize.define('MenuImage', {

        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        branch_id: DataTypes.BIGINT,

        image: DataTypes.STRING,

        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }

    }, {

        tableName: 'menu_images',

        timestamps: true,

        createdAt: 'created_at',

        updatedAt: 'updated_at'

    });

    MenuImage.associate = (models) => {

        MenuImage.belongsTo(models.Branch, {

            foreignKey: 'branch_id'

        });

    };

    return MenuImage;

};