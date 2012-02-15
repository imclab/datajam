class SiteTemplate < Template

  before_validation :only_one, :on => :create

  after_create do
    # Make sure there's always an /archives page
    Cacher.cache_archives
  end

  after_save do
    Event.all.each { |e| e.save }
  end

  protected

  def only_one
    self.errors.add :base, "Only one SiteTemplate can be created" if SiteTemplate.all.count > 0
  end

end
